#[starknet::contract]
pub mod AutoShare {
    use core::array::ArrayTrait;
    use core::byte_array::ByteArray;
    use openzeppelin::token::erc20::interface::IERC20;
    use openzeppelin::upgrades::UpgradeableComponent;
    use starknet::storage::{
        Map, MutableVecTrait, StorageMapReadAccess, StorageMapWriteAccess, StoragePathEntry,
        StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
    };
    use starknet::{ClassHash, ContractAddress, get_caller_address};
    use crate::base::errors::{
        ERR_DUPLICATE_ADDRESS, ERR_INVALID_PERCENTAGE_SUM, ERR_TOO_FEW_MEMBERS, ERR_UNAUTHORIZED,
    };
    use crate::base::events::GroupCreated;
    use crate::base::types::{Group, GroupMember};
    use crate::interfaces::iautoshare::IAutoShare;

    // components definition
    // component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Upgradeable
    // impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

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
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        GroupCreated: GroupCreated,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[constructor]
    pub fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.group_count.write(0);
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

            assert(sum == 100, 'cummulative share not 100%');
            let id = self.group_count.read() + 1;

            let group = Group { id, name: name.clone(), amount, creator: get_caller_address() };
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


        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) { // Stub for upgradeability
        }
    }
}
