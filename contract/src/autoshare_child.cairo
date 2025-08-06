#[starknet::contract]
pub mod AutoshareChild {
    use starknet::get_block_timestamp;
use starknet::get_caller_address;
use starknet::get_contract_address;
use starknet::ContractAddress;
    use starknet::storage::{
        Map, MutableVecTrait, StorageMapReadAccess, StorageMapWriteAccess, StoragePathEntry,
        StoragePointerReadAccess, StoragePointerWriteAccess, Vec, VecTrait,
    };
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::base::types::{Group, GroupMember};
    use crate::interfaces::iautoshare_child::IAutoshareChild;

    #[storage]
    struct Storage {
        group_id: u256,
        group: Group,
        parent_contract_address: ContractAddress,
        created_at: u64,
        group_members: Vec<GroupMember>,
        token_address: ContractAddress,
        admin: ContractAddress,
    }

    #[constructor]
    pub fn constructor(
        ref self: ContractState,
        group_id: u256,
        group: Group,
        parent_contract_address: ContractAddress,
        name: ByteArray,
        amount: u256,
        creator: ContractAddress,
        members: Array<GroupMember>,
        token_address: ContractAddress,
        admin: ContractAddress,
    ) {
        self.group_id.write(group_id);
        self.group.write(group);
        self.parent_contract_address.write(parent_contract_address);
        self.created_at.write(get_block_timestamp());
        self.token_address.write(token_address);
        self.admin.write(admin);

        for i in 0..members.len() {
            let member: GroupMember = *members.at(i);
            self.group_members.push(member);
        }
    }

    #[abi(embed_v0)]
    impl AutoshareChildImpl of IAutoshareChild<ContractState> {
        fn pay(
            ref self: contract::autoshare_child::AutoshareChild::ContractState,
            group_id: core::integer::u256,
        ) {
            let mut group: Group = self.group.read();
            assert(!group.is_paid, 'group is already paid');
            assert(group.id != 0, 'group id is 0');
            let group_members_vec = self.group_members;
            let amount = group.amount;
            for member in 0..group_members_vec.len() {
                let member: GroupMember = group_members_vec.at(member).read();
                let members_money = amount * member.percentage.try_into().unwrap() / 100;
                self._process_payment(members_money, member.addr);
            }
            group.is_paid = true;
            self.group.write(group);
        }

        fn get_group_member(ref self: ContractState, group_id: u256) -> Array<GroupMember> {
            let mut members = self.group_members;
            let mut group_members: Array<GroupMember> = array![];
            for i in 0..members.len() {
                let member: GroupMember = members.at(i).read();
                group_members.append(member);
            }
            group_members
        }

        fn emergency_withdraw(
            ref self: contract::autoshare_child::AutoshareChild::ContractState,
            group_id: core::integer::u256,
        ) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'caller is not admin');
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let contract_address = get_contract_address();
            let balance: u256 = token.balance_of(contract_address);
            token.transfer(self.parent_contract_address.read(), balance);
        }

        fn get_balance(
            ref self: contract::autoshare_child::AutoshareChild::ContractState,
        ) -> core::integer::u256 {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let contract_address = get_contract_address();
            token.balance_of(contract_address)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _process_payment(
            ref self: ContractState,
            amount: u256,
            addr_to: ContractAddress,
        ) {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let contract_address = get_contract_address();
            self._check_token_balance(contract_address, amount);
            token.transfer(addr_to, amount);
        }

        fn _check_token_balance(ref self: ContractState, caller: ContractAddress, amount: u256) {
            let token = IERC20Dispatcher { contract_address: self.token_address.read() };
            let balance = token.balance_of(caller);
            assert(balance >= amount, 'insufficient balance');
        }
    }
}
