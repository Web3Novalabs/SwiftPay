use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::storage::{MutableVecTrait, StoragePointerReadAccess, StoragePointerWriteAccess, Vec};
use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
use crate::base::types::{Group, GroupMember};

#[starknet::interface]
pub trait IAutoshareChild<TContractState> {
    fn get_details_of_child(
        ref self: TContractState,
    ) -> (
        u256, Group, Array<GroupMember>, u256, u64,
    ); // id, group details, array of group members, balance, created_at
    fn emergency_withdraw(ref self: TContractState);
}
#[starknet::contract]
pub mod AutoshareChild {
    use super::*;

    #[storage]
    struct Storage {
        id: u256,
        group: Group,
        members: Vec<GroupMember>,
        emergency_withdraw_address: ContractAddress,
        created_at: u64,
        token_address: ContractAddress,
        admin: ContractAddress,
        main_contract_address: ContractAddress,
    }

    #[constructor]
    pub fn constructor(
        ref self: ContractState,
        group_id: u256,
        group: Group,
        emergency_withdraw_address: ContractAddress,
        members: Array<GroupMember>,
        token_address: ContractAddress,
        admin: ContractAddress,
        main_contract_address: ContractAddress,
    ) {
        self.id.write(group_id);
        self.group.write(group);
        self.emergency_withdraw_address.write(emergency_withdraw_address);
        self.created_at.write(get_block_timestamp());
        self.token_address.write(token_address);
        self.admin.write(admin);

        for i in 0..members.len() {
            let member: GroupMember = *members.at(i);
            self.members.push(member);
        }
        self.main_contract_address.write(main_contract_address);
        // approve the main contract to spend the token inside the child contract
        self._approve_main_contract();
    }

    const MAIN_AMOUNT: u256 = 900_000_000_000_000_000_000_000_000_000_000;

    #[abi(embed_v0)]
    impl AutoshareChildImpl of IAutoshareChild<ContractState> {
        fn get_details_of_child(
            ref self: ContractState,
        ) -> (u256, Group, Array<GroupMember>, u256, u64) {
            self.assert_only_admin();
            let contract_address = get_contract_address();

            let id = self.id.read();

            let group = self.group.read();

            let created_at = self.created_at.read();

            let mut members = self.members;
            let mut group_members: Array<GroupMember> = array![];
            for i in 0..members.len() {
                let member: GroupMember = members.at(i).read();
                group_members.append(member);
            }

            let balance = self._check_token_balance(contract_address);

            return (id, group, group_members, balance, created_at);
        }

        fn emergency_withdraw(ref self: ContractState) {
            self.assert_only_admin();
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let balance = self._check_token_balance(get_contract_address());
            token.transfer(self.emergency_withdraw_address.read(), balance);
        }
    }

    #[generate_trait]
    impl SecurityImpl of SecurityTrait {
        fn assert_only_admin(self: @ContractState) {
            let caller = get_caller_address();
            assert(self.admin.read() == caller, 'Only admin allowed');
        }
    }

    #[generate_trait]
    impl internal of InternalTrait {
        fn _check_token_balance(self: @ContractState, caller: ContractAddress) -> u256 {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let balance = token.balance_of(caller);
            balance
        }

        fn _approve_main_contract(ref self: ContractState) {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            token.approve(self.main_contract_address.read(), MAIN_AMOUNT);
        }
    }
}
