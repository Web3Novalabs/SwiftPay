use starknet::{ClassHash, ContractAddress};
use crate::base::types::{Group, GroupMember, GroupUpdateRequest};
#[starknet::interface]
pub trait IAutoShareParent<TContractState> {
    fn create_group(
        ref self: TContractState,
        name: ByteArray,
        amount: u256,
        members: Array<GroupMember>,
        token_address: ContractAddress,
    );

    fn get_group(self: @TContractState, group_id: u256) -> Group;
    fn get_group_address(self: @TContractState, group_id: u256) -> ContractAddress;

    fn get_all_groups(self: @TContractState) -> Array<Group>;
    fn get_groups_by_paid(self: @TContractState, is_paid: bool) -> Array<Group>;
    fn get_group_member(self: @TContractState, group_id: u256) -> Array<GroupMember>;

    fn get_address_groups(self: @TContractState, address: ContractAddress) -> Array<Group>;

    fn upgrade(ref self: TContractState, new_class_hash: ClassHash);


    fn request_group_update(
        ref self: TContractState,
        group_id: u256,
        new_name: ByteArray,
        new_amount: u256,
        new_members: Array<GroupMember>,
    );
    fn approve_group_update(ref self: TContractState, group_id: u256);
    fn execute_group_update(ref self: TContractState, group_id: u256);
}
