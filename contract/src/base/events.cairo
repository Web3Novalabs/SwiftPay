use starknet::ContractAddress;

// Event emitted when a group is created
#[derive(Serde, Drop, starknet::Event)]
pub struct GroupCreated {
    pub group_id: u256,
    pub creator: ContractAddress,
    pub name: ByteArray,
    pub amount: u256,
}
