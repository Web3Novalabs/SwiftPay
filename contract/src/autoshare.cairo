#[starknet::contract]
pub mod AutoShare {
    use core::array::ArrayTrait;
    use core::byte_array::ByteArray;
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin::upgrades::UpgradeableComponent;
    use starknet::storage::{
        Map, MutableVecTrait, StorageMapReadAccess, StorageMapWriteAccess, StoragePathEntry,
        StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
    };
    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ClassHash, ContractAddress, contract_address_const, get_caller_address,
        get_contract_address,
    };
    use crate::base::errors::{
        ERROR_ZERO_ADDRESS, ERR_ALREADY_APPROVED, ERR_DUPLICATE_ADDRESS, ERR_GROUP_NOT_FOUND,
        ERR_INSUFFICIENT_APPROVALS, ERR_INVALID_PERCENTAGE_SUM, ERR_NOT_GROUP_MEMBER,
        ERR_TOO_FEW_MEMBERS, ERR_UNAUTHORIZED, ERR_UPDATE_FEE_NOT_PAID,
        ERR_UPDATE_REQUEST_NOT_FOUND, INSUFFICIENT_ALLOWANCE, INSUFFICIENT_STRK_BALANCE,
    };
    use crate::base::events::{
        GroupCreated, GroupUpdateApproved, GroupUpdateRequested, GroupUpdated,
    };
    use crate::base::types::{Group, GroupMember, GroupUpdateRequest};
    use crate::interfaces::iautoshare::IAutoShare;
    const ONE_STRK: u256 = 1_000_000_000_000_000_000;

    // components definition
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        groups: Map<u256, Group>,
        group_members: Map<u256, Vec<GroupMember>>,
        group_count: u256,
        admin: ContractAddress,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        token_address: ContractAddress,
        // Group update storage
        update_request_count: u256,
        update_requests: Map<u256, GroupUpdateRequest>, // group_id -> update_request
        update_request_new_members: Map<u256, Vec<GroupMember>>, // group_id -> new_members
        update_approvals: Map<(u256, ContractAddress), bool>, // (group_id, member) -> has_approved
        has_pending_update: Map<u256, bool>, // group_id -> has_pending_update
        child_contract_class_hash: ClassHash,
        group_addresses: Map<u256, ContractAddress>, // group_id -> child_contract_address
        emergency_withdraw_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        GroupCreated: GroupCreated,
        GroupUpdateRequested: GroupUpdateRequested,
        GroupUpdateApproved: GroupUpdateApproved,
        GroupUpdated: GroupUpdated,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[constructor]
    pub fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        token_address: ContractAddress,
        emergency_withdraw_address: ContractAddress,
        child_contract_class_hash: ClassHash,
    ) {
        assert(admin != contract_address_const::<0>(), ERROR_ZERO_ADDRESS);
        self.admin.write(admin);
        self.group_count.write(0);
        self.update_request_count.write(0);
        self.token_address.write(token_address);
        self.emergency_withdraw_address.write(emergency_withdraw_address);
        self.child_contract_class_hash.write(child_contract_class_hash);
    }

    #[generate_trait]
    impl SecurityImpl of SecurityTrait {
        fn assert_only_admin(self: @ContractState) {
            let caller = get_caller_address();

            assert(self.admin.read() == caller, 'Only admin allowed');
        }

        fn is_admin_or_creator(self: @ContractState, group: Group) {
            let caller = get_caller_address();
            let permission = caller == self.admin.read() || caller == group.creator;
            assert(permission, 'only owner or admin');
        }

        // Asserts that creator meets group creation fee requirements
        fn assert_group_creation_fee_requirements(
            self: @ContractState,
            token: IERC20Dispatcher,
            creator: ContractAddress,
            contract_address: ContractAddress,
        ) {
            let creator_balance = token.balance_of(creator);
            assert(creator_balance >= ONE_STRK, INSUFFICIENT_STRK_BALANCE);

            let allowed_amount = token.allowance(creator, contract_address);
            assert(allowed_amount >= ONE_STRK, INSUFFICIENT_ALLOWANCE);
        }
    }

    #[abi(embed_v0)]
    impl autoshare of IAutoShare<ContractState> {
        fn create_group(
            ref self: ContractState,
            name: ByteArray,
            amount: u256,
            members: Array<GroupMember>,
            token_address: ContractAddress,
        ) {
            assert(get_caller_address() != contract_address_const::<0>(), ERROR_ZERO_ADDRESS);
            let member_count: usize = members.len();
            assert(member_count >= 2, 'member is less than 2');

            let mut sum: u32 = 0;
            let mut i: usize = 0;

            // check for duplicate address and
            // the split calculation will be 100% across all address
            while i < member_count {
                let m = members.at(i).clone();
                sum += m.percentage.try_into().unwrap();
                let mut j: usize = i + 1;
                while j < member_count {
                    let duplicate = m.addr == members.at(j).clone().addr;
                    assert(!duplicate, 'list contain dublicate address');
                    j += 1;
                }
                i += 1;
            }
            let caller = get_caller_address();
            assert(caller != contract_address_const::<0>(), ERROR_ZERO_ADDRESS);

            assert(sum == 100, 'cummulative share not 100%');
            let id = self.group_count.read() + 1;

            let group = Group {
                id, name: name.clone(), amount, is_paid: false, creator: get_caller_address(),
            };
            self.groups.write(id, group.clone());

            i = 0;
            while i < member_count {
                self.group_members.entry(id).push(members.at(i).clone());
                i += 1;
            }
            // Collect pool creation fee (1 STRK)
            self._collect_group_creation_fee(caller);
            self.group_count.write(id);

            let mut constructor_calldata: Array<felt252> = array![];
            (
                id,
                group,
                self.emergency_withdraw_address.read(),
                members,
                token_address,
                self.admin.read(),
                get_contract_address(),
            )
                .serialize(ref constructor_calldata);

            let (contract_address_for_group, _) = deploy_syscall(
                self.child_contract_class_hash.read(), 0, constructor_calldata.span(), false,
            )
                .unwrap();
            self.group_addresses.write(id, contract_address_for_group);

            self
                .emit(
                    Event::GroupCreated(
                        GroupCreated { group_id: id, creator: get_caller_address(), name, amount },
                    ),
                );
        }

        fn get_group(self: @ContractState, group_id: u256) -> Group {
            let group: Group = self.groups.read(group_id);
            group
        }

        // Returns all groups
        fn get_all_groups(self: @ContractState) -> Array<Group> {
            let mut groups: Array<Group> = ArrayTrait::new();
            let count = self.group_count.read();
            let mut i: u256 = 1;
            while i <= count {
                let group = self.groups.read(i);
                groups.append(group);
                i = i + 1;
            }
            groups
        }

        // Returns all groups where is_paid matches the argument
        fn get_groups_by_paid(self: @ContractState, is_paid: bool) -> Array<Group> {
            let mut groups: Array<Group> = ArrayTrait::new();
            let count = self.group_count.read();
            let mut i: u256 = 1;
            while i <= count {
                let group = self.groups.read(i);
                if group.is_paid == is_paid {
                    groups.append(group);
                }
                i = i + 1;
            }
            groups
        }

        fn get_group_member(self: @ContractState, group_id: u256) -> Array<GroupMember> {
            let members = self.group_members.entry(group_id);
            let mut group_members: Array<GroupMember> = ArrayTrait::new();

            let mut i: u64 = 0;
            let len: u64 = members.len();
            while i < len {
                group_members.append(members.at(i).read());
                i += 1;
            }
            group_members
        }
        fn get_address_groups(self: @ContractState, address: ContractAddress) -> Array<Group> {
            let mut group: Array<Group> = ArrayTrait::new();
            let count = self.group_count.read();
            print!("count {}", count);
            let len: u64 = count.try_into().unwrap();
            let mut i: u64 = 1;
            while i <= len {
                let m: u256 = i.try_into().unwrap();

                let group_member = self.group_members.entry(m);

                for member in 0..group_member.len() {
                    let vec = group_member.at(member).read();
                    if vec.addr == address {
                        let has_share_in_group = self.groups.read(m);
                        group.append(has_share_in_group);
                    }
                }
                i = i + 1;
            }
            group
        }

        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.assert_only_admin();

            assert(new_class_hash.is_non_zero(), 'Class hash cannot be zero');

            starknet::syscalls::replace_class_syscall(new_class_hash).unwrap();
        }

        fn pay(ref self: ContractState, group_id: u256) {
            let mut group: Group = self.get_group(group_id);
            assert(!group.is_paid, 'group is already paid');
            assert(group.id != 0, 'group id is 0');
            // removed the logic where caller is the creator
            let group_members_vec = self.group_members.entry(group_id);
            let group_address = self.group_addresses.read(group_id);
            let amount = self._check_token_balance_of_child(group_address);
            for member in 0..group_members_vec.len() {
                let member: GroupMember = group_members_vec.at(member).read();
                let members_money = amount * member.percentage.try_into().unwrap() / 100;
                // now transfer from group address to member address
                let token = IERC20Dispatcher { contract_address: self.token_address.read() };
                token.transfer(member.addr, members_money);
            }
            group.is_paid = true;
            self.groups.write(group_id, group);
        }

        fn request_group_update(
            ref self: ContractState,
            group_id: u256,
            new_name: ByteArray,
            new_amount: u256,
            new_members: Array<GroupMember>,
        ) {
            let mut group: Group = self.get_group(group_id);
            assert(group.id != 0, ERR_GROUP_NOT_FOUND);
            let caller = get_caller_address();
            assert(caller == group.creator, 'caller is not creator');

            let mut sum: u32 = 0;
            let mut i: usize = 0;

            // This code checks for duplicate addresses among group members
            let member_count = new_members.len();
            while i < member_count {
                let m = new_members.at(i).clone();
                sum += m.percentage.try_into().unwrap();
                let mut j: usize = i + 1;
                while j < member_count {
                    let duplicate = m.addr == new_members.at(j).clone().addr;
                    assert(!duplicate, 'list contain duplicate address');
                    j += 1;
                }
                i += 1;
            }
            assert(sum == 100, 'total percentage must be 100');

            // let is_member = self.is_group_member(group_id, caller);
            // assert(is_member == true, 'caller is not a group member');

            // Store the new members separately
            let mut i: usize = 0;
            let member_count = new_members.len();
            while i < member_count {
                let member = new_members.at(i);
                // self.update_request_new_members.entry(group_id).push(member);
                self.update_request_new_members.entry(group_id).append().write(*member);
                i += 1;
            }

            let update_request = GroupUpdateRequest {
                group_id,
                new_name: new_name.clone(),
                new_amount: new_amount,
                requester: caller,
                fee_paid: false,
                approval_count: 0,
                // total_members: member_count.try_into().unwrap(),
                is_completed: false,
            };

            // Collect the update fee
            self._collect_group_update_fee(caller);

            // set fee_paid to true after collecting the fee
            let mut update_request_paid = update_request.clone();
            update_request_paid.fee_paid = true;
            self.update_requests.write(group_id, update_request_paid);

            self.has_pending_update.write(group_id, true);

            self
                .emit(
                    Event::GroupUpdateRequested(
                        GroupUpdateRequested {
                            group_id,
                            requester: caller,
                            new_name: new_name.clone(),
                            new_amount: new_amount,
                        },
                    ),
                );
        }

        fn approve_group_update(ref self: ContractState, group_id: u256) {
            let mut group: Group = self.get_group(group_id);
            assert(group.id != 0, ERR_GROUP_NOT_FOUND);
            let caller = get_caller_address();

            let is_member = self.is_group_member(group_id, caller);
            assert(is_member == true, 'caller is not a group member');

            // Check if the group has a pending update
            let already_approved = self.update_approvals.read((group_id, caller));
            assert(already_approved == false, ERR_ALREADY_APPROVED);

            let update_request: GroupUpdateRequest = self.update_requests.read(group_id);

            // checks if the update fee has been paid

            assert(update_request.fee_paid == true, ERR_UPDATE_FEE_NOT_PAID);

            // check if the update request exists and is not completed
            assert(update_request.is_completed == false, ERR_UPDATE_REQUEST_NOT_FOUND);

            let approval_count = update_request.approval_count;
            let total_members = self.get_group_member(group_id);
            let total_members = total_members.len();
            assert(approval_count < total_members.try_into().unwrap(), ERR_INSUFFICIENT_APPROVALS);

            // Mark caller as having approved the update
            self.update_approvals.write((group_id, caller), true);

            let approval_counts = approval_count + 1;
            let mut updated_request = update_request.clone();
            updated_request.approval_count = approval_counts;

            // Clone for event BEFORE moving to storage
            let updated_request_for_event = updated_request.clone();

            self.update_requests.write(group_id, updated_request);
            if approval_counts == total_members.try_into().unwrap() {
                let mut final_request = updated_request_for_event.clone();
                final_request.is_completed = true;
                self.update_requests.write(group_id, final_request);
                self.has_pending_update.write(group_id, false);

                let new_members = self.get_update_request_new_members(group_id);
                let mut member_count: u32 = new_members.len();

                self
                    .emit(
                        Event::GroupUpdated(
                            GroupUpdated {
                                group_id,
                                old_name: group.name.clone(),
                                new_name: updated_request_for_event.new_name.clone(),
                                old_amount: group.amount,
                                new_amount: updated_request_for_event.new_amount,
                            },
                        ),
                    );
            }

            self
                .emit(
                    Event::GroupUpdateApproved(
                        GroupUpdateApproved {
                            group_id,
                            approver: caller,
                            approval_count: approval_counts,
                            total_members: total_members.try_into().unwrap(),
                        },
                    ),
                );
        }

        fn execute_group_update(ref self: ContractState, group_id: u256) {
            let mut group: Group = self.get_group(group_id);
            assert(group.id != 0, ERR_GROUP_NOT_FOUND);
            let caller = get_caller_address();

            // Check if the group has a pending update
            let has_pending_update = self.has_pending_update.read(group_id);
            assert(has_pending_update == false, 'no pending updt for this group');

            // Retrieve the update request
            let update_request: GroupUpdateRequest = self.update_requests.read(group_id);

            assert(update_request.is_completed == true, 'update request not completed');

            // Check if the caller is the group creator
            let is_creator = caller == group.creator;
            assert(is_creator, 'caller is not the group creator');

            // Store old and new values for the event BEFORE moving group
            let old_name = group.name.clone();
            let old_amount = group.amount;
            let new_name = update_request.new_name.clone();
            let new_amount = update_request.new_amount;

            // Update the group with new values
            group.name = new_name.clone();
            group.amount = new_amount;
            group.is_paid = false; // Reset is_paid to false after update
            self.groups.write(group_id, group);

            // Clear the update request
            self
                .update_requests
                .write(
                    group_id,
                    GroupUpdateRequest {
                        group_id: 0,
                        new_name: "",
                        new_amount: 0,
                        requester: starknet::contract_address_const::<0>(),
                        fee_paid: false,
                        approval_count: 0,
                        // total_members: 0,
                        is_completed: false,
                    },
                );

            // remove all previous members
            let new_members = self.get_update_request_new_members(group_id);
            let mut member_count: u32 = new_members.len();
            let mut members_vec = self.group_members.entry(group_id);
            while member_count > 0 {
                members_vec.pop();
                member_count -= 1;
            }

            let mut i: u32 = 0;
            let member_count = self.update_request_new_members.entry(group_id);
            let mut len: u32 = member_count.len().try_into().unwrap();
            while i < len {
                let m: u64 = i.try_into().unwrap();
                let member = new_members.at(i).clone();
                self.group_members.entry(group_id).push(member);
                i += 1;
            }

            // Clear the new members for the update request
            let mut new_members_vec = self.update_request_new_members.entry(group_id);
            let mut len = new_members_vec.len();
            while len > 0 {
                new_members_vec.pop();
                len -= 1;
            }

            // Clear the update approvals for all current group members
            let group_members_vec = self.group_members.entry(group_id);
            let mut i: u64 = 0;
            let len: u64 = group_members_vec.len();
            while i < len {
                let member = group_members_vec.at(i).read();
                self.update_approvals.write((group_id, member.addr), false);
                i += 1;
            }

            // Clear the pending update status
            self.has_pending_update.write(group_id, false);

            // Emit the GroupUpdated event
            self
                .emit(
                    Event::GroupUpdated(
                        GroupUpdated { group_id, old_name, new_name, old_amount, new_amount },
                    ),
                );
        }
    }

    #[generate_trait]
    impl internal of InternalTrait {
        fn _process_payment(
            ref self: ContractState,
            amount: u256,
            addr_from: ContractAddress,
            addr_to: ContractAddress,
        ) {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let caller = get_caller_address();
            let contract_address = get_contract_address();
            self._check_token_allowance(caller, amount);
            self._check_token_balance(caller, amount);
            token.transfer_from(addr_from, addr_to, amount);
        }

        /// Returns true if the address is found among the group members, false otherwise.
        fn is_group_member(
            ref self: ContractState, group_id: u256, member_addr: ContractAddress,
        ) -> bool {
            // Get the vector of group members for the given group_id
            let group_members = self.group_members.entry(group_id);

            // Iterate over the group members
            let mut i: u64 = 0;
            let len: u64 = group_members.len();
            while i < len {
                let member = group_members.at(i).read();
                if member_addr == member.addr {
                    return true;
                }
                i += 1;
            }
            false
        }

        fn _collect_group_update_fee(ref self: ContractState, requester: ContractAddress) {
            // Retrieve the STRK token contract
            let strk_token = IERC20Dispatcher { contract_address: self.token_address.read() };

            // Check update fee requirements
            let _contract_address = get_contract_address();
            self.assert_group_creation_fee_requirements(strk_token, requester, _contract_address);

            // Transfer the update fee from requester to the contract
            strk_token.transfer_from(requester, _contract_address, ONE_STRK);
        }

        fn get_update_request_new_members(
            self: @ContractState, group_id: u256,
        ) -> Array<GroupMember> {
            let new_members_vec = self.update_request_new_members.entry(group_id);
            let mut result = ArrayTrait::new();

            let mut i: u64 = 0;
            let len: u64 = new_members_vec.len();
            while i < len {
                let member = new_members_vec.at(i).read();
                result.append(member);
                i += 1;
            }

            result
        }

        // Collects the group creation fee from the creator.
        fn _collect_group_creation_fee(ref self: ContractState, creator: ContractAddress) {
            // Retrieve the STRK token contract
            let strk_token = IERC20Dispatcher { contract_address: self.token_address.read() };

            // Check group creation fee requirements using SecurityTrait
            let _contract_address = get_contract_address();
            self.assert_group_creation_fee_requirements(strk_token, creator, _contract_address);

            // Transfer the pool creation fee from creator to the contract
            strk_token.transfer_from(creator, _contract_address, ONE_STRK);
        }

        fn _check_token_allowance(ref self: ContractState, spender: ContractAddress, amount: u256) {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let allowance = token.allowance(spender, starknet::get_contract_address());
            assert(allowance >= amount, 'insufficient allowance');
        }

        fn _check_token_balance(ref self: ContractState, caller: ContractAddress, amount: u256) {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let balance = token.balance_of(caller);
            assert(balance >= amount, 'insufficient balance');
        }

        fn _check_token_balance_of_child(
            self: @ContractState, group_address: ContractAddress,
        ) -> u256 {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let balance = token.balance_of(group_address);
            balance
        }
    }
}
