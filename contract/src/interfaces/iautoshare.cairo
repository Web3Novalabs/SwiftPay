use starknet::{ClassHash, ContractAddress};
use crate::base::types::{Group, GroupMember};
#[starknet::interface]
pub trait IAutoShare<TContractState> {
    fn create_group(
        ref self: TContractState,
        name: ByteArray,
        amount: u256,
        members: Array<GroupMember>,
        token_address: ContractAddress,
    );

    fn get_group(self: @TContractState, group_id: u256) -> Group;
    fn get_all_groups(self: @TContractState) -> Array<Group>;
    fn get_groups_by_paid(self: @TContractState, is_paid: bool) -> Array<Group>;

    // Upgradeability

    /// @notice Upgrades the contract implementation.
    /// @param new_class_hash The class hash of the new implementation.
    /// @dev Can only be called by admin when contract is not paused.
    fn upgrade(ref self: TContractState, new_class_hash: ClassHash);

    fn pay(ref self: TContractState, group_id: u256);
}
