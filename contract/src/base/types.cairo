use starknet::ContractAddress;
// GroupMember type
#[derive(Serde, Drop, Copy, starknet::Store, PartialEq)]
pub struct GroupMember {
    pub addr: ContractAddress,
    pub percentage: u8,
}

// Group type
#[derive(Serde, Drop, Clone, starknet::Store, PartialEq)]
pub struct Group {
    pub id: u256,
    pub name: ByteArray,
    pub amount: u256,
    pub creator: ContractAddress,
}
