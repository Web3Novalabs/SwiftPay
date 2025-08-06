use crate::base::types::GroupMember;
#[starknet::interface]
pub trait IAutoshareChild<TContractState> {
    // splits the money in a group to the members
    fn pay(ref self: TContractState, group_id: u256);
    // get members of a group
    fn get_group_member(ref self: TContractState, group_id: u256) -> Array<GroupMember>;
    // emergency withdraw
    fn emergency_withdraw(ref self: TContractState, group_id: u256);
    // get the balance of the contract
    fn get_balance(ref self: TContractState) -> u256;
}
