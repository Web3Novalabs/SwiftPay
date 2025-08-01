use starknet::ContractAddress;

// Event emitted when a group is created
#[derive(Serde, Drop, starknet::Event)]
pub struct GroupCreated {
    pub group_id: u256,
    pub creator: ContractAddress,
    pub name: ByteArray,
    pub amount: u256,
}

// Event emitted when a group update is requested
#[derive(Serde, Drop, starknet::Event)]
pub struct GroupUpdateRequested {
    pub group_id: u256,
    pub requester: ContractAddress,
    pub new_name: ByteArray,
    pub new_amount: u256,
}

// Event emitted when a group member approves an update
#[derive(Serde, Drop, starknet::Event)]
pub struct GroupUpdateApproved {
    pub group_id: u256,
    pub approver: ContractAddress,
    pub approval_count: u8,
    pub total_members: u8,
}

// Event emitted when a group update is executed
#[derive(Serde, Drop, starknet::Event)]
pub struct GroupUpdated {
    pub group_id: u256,
    pub old_name: ByteArray,
    pub new_name: ByteArray,
    pub old_amount: u256,
    pub new_amount: u256,
}
