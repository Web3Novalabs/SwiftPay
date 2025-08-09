use starknet::{ClassHash, ContractAddress};
use crate::base::types::{Group, GroupMember, GroupUpdateRequest};
#[starknet::interface]
pub trait IAutoShare<TContractState> {
    fn create_group(
        ref self: TContractState,
        name: ByteArray,
        members: Array<GroupMember>,
        token_address: ContractAddress,
    );

    fn get_group(self: @TContractState, group_id: u256) -> Group;
    fn get_group_address(self: @TContractState, group_id: u256) -> ContractAddress;
    fn get_all_groups(self: @TContractState) -> Array<Group>;
    fn get_groups_by_paid(self: @TContractState, is_paid: bool) -> Array<Group>;
    fn get_group_member(self: @TContractState, group_id: u256) -> Array<GroupMember>;
    // return the list of groups that a address is part of
    fn get_address_groups(self: @TContractState, address: ContractAddress) -> Array<Group>;
    // Upgradeability

    /// @notice Upgrades the contract implementation.
    /// @param new_class_hash The class hash of the new implementation.
    /// @dev Can only be called by admin when contract is not paused.
    fn upgrade(ref self: TContractState, new_class_hash: ClassHash);

    fn pay(ref self: TContractState, group_address: ContractAddress);
    fn get_group_balance(self: @TContractState, group_address: ContractAddress) -> u256;

    fn request_group_update(
        ref self: TContractState,
        group_id: u256,
        new_name: ByteArray,
        new_members: Array<GroupMember>,
    );
    fn approve_group_update(ref self: TContractState, group_id: u256);
    // // fn reject_group_update(ref self: TContractState, group_id: u256);
    fn execute_group_update(ref self: TContractState, group_id: u256);
    // fn get_group_update_requests(self: @TContractState) -> Array<GroupUpdateRequest>;
// fn get_group_update_request(self: @TContractState, group_id: u256) -> GroupUpdateRequest;
}
