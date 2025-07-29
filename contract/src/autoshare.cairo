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
    use starknet::{
        ClassHash, ContractAddress, contract_address_const, get_caller_address,
        get_contract_address,
    };
    use crate::base::errors::{
        ERROR_ZERO_ADDRESS, ERR_DUPLICATE_ADDRESS, ERR_INVALID_PERCENTAGE_SUM, ERR_TOO_FEW_MEMBERS,
        ERR_UNAUTHORIZED,
    };
    use crate::base::events::GroupCreated;
    use crate::base::types::{Group, GroupMember};
    use crate::interfaces::iautoshare::IAutoShare;

    // components definition
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        groups: Map<u256, Group>,
        group_members: Map<
            u256, Vec<GroupMember>,
        >, // or Map<u256, Map<u32, GroupMember>> for indexed access
        group_count: u256,
        admin: ContractAddress,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        token_address: ContractAddress,
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        GroupCreated: GroupCreated,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[constructor]
    pub fn constructor(
        ref self: ContractState, admin: ContractAddress, token_address: ContractAddress,
    ) {
        assert(admin != contract_address_const::<0>(), ERROR_ZERO_ADDRESS);
        self.admin.write(admin);
        self.group_count.write(0);
        self.token_address.write(token_address);
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
                    assert(!duplicate, 'list contsin dublicate address');
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
            self.groups.write(id, group);

            i = 0;
            while i < member_count {
                self.group_members.entry(id).push(members.at(i).clone());
                i += 1;
            }
            self.group_count.write(id);

            self
                .emit(
                    Event::GroupCreated(
                        GroupCreated { group_id: id, creator: get_caller_address(), name, amount },
                    ),
                );
        }

        fn get_group(self: @ContractState, group_id: u256) -> Group {
            let group: Group = self.groups.read(group_id);
            self.is_admin_or_creator(group);
            let group: Group = self.groups.read(group_id);
            group
        }


        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.assert_only_admin();

            assert(new_class_hash.is_non_zero(), 'Class hash cannot be zero');

            starknet::syscalls::replace_class_syscall(new_class_hash).unwrap();
        }

        fn pay(ref self: ContractState, group_id: u256) {
            let mut group = self.get_group(group_id);
            let amount = group.amount;
            self._process_payment(amount);
            group.is_paid = true;
            self.groups.write(group_id, group);
        }
    }

    #[generate_trait]
    impl internal of InternalTrait {
        fn _process_payment(ref self: ContractState, amount: u256) {
            let strk_token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let caller = get_caller_address();
            let contract_address = get_contract_address();
            self._check_token_allowance(caller, amount);
            self._check_token_balance(caller, amount);
            strk_token.transfer_from(caller, contract_address, amount);
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
    }
}
