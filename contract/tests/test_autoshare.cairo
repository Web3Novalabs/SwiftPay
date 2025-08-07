use contract::autoshare_child::{IAutoshareChildDispatcher, IAutoshareChildDispatcherTrait};
use contract::base::errors::{
    ERR_DUPLICATE_ADDRESS, ERR_GROUP_NOT_FOUND, ERR_INVALID_PERCENTAGE_SUM, ERR_TOO_FEW_MEMBERS,
    ERR_UNAUTHORIZED,
};
use contract::base::types::GroupMember;
use contract::interfaces::iautoshare::{IAutoShareDispatcher, IAutoShareDispatcherTrait};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
    stop_cheat_caller_address,
};
use starknet::{ClassHash, ContractAddress};

const ADMIN_CONST: felt252 = 123;
const CREATOR_CONST: felt252 = 456;
const USER1_CONST: felt252 = 101112;
const USER2_CONST: felt252 = 131415;
const USER3_CONST: felt252 = 1314164;
const TOKEN_CONST: felt252 = 13141324;
const EMERGENCY_WITHDRAW_CONST: felt252 = 13141325;

pub fn ADMIN_ADDR() -> ContractAddress {
    ADMIN_CONST.try_into().unwrap()
}

pub fn CREATOR_ADDR() -> ContractAddress {
    CREATOR_CONST.try_into().unwrap()
}

pub fn USER1_ADDR() -> ContractAddress {
    USER1_CONST.try_into().unwrap()
}

pub fn USER2_ADDR() -> ContractAddress {
    USER2_CONST.try_into().unwrap()
}

pub fn USER3_ADDR() -> ContractAddress {
    USER3_CONST.try_into().unwrap()
}

pub fn TOKEN_ADDR() -> ContractAddress {
    TOKEN_CONST.try_into().unwrap()
}

pub fn EMERGENCY_WITHDRAW_ADDR() -> ContractAddress {
    EMERGENCY_WITHDRAW_CONST.try_into().unwrap()
}


// deploy the autoshare contract
fn deploy_autoshare_contract() -> (IAutoShareDispatcher, IERC20Dispatcher) {
    let erc20_class = declare("STARKTOKEN").unwrap().contract_class();
    let mut calldata = array![CREATOR_ADDR().into(), CREATOR_ADDR().into(), 6];
    let (erc20_address, _) = erc20_class.deploy(@calldata).unwrap();
    let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_address };

    let child_contract: ClassHash = *declare("AutoshareChild").unwrap().contract_class().class_hash;

    let contract = declare("AutoShare").unwrap().contract_class();
    let constructor_calldata = array![
        ADMIN_ADDR().into(),
        erc20_address.into(),
        EMERGENCY_WITHDRAW_ADDR().into(),
        child_contract.into(),
    ];
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

    let AutoShare = IAutoShareDispatcher { contract_address };
    (AutoShare, erc20_dispatcher)
}


#[test]
fn test_create_group_success() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    let contract_balance_before = erc20_dispatcher.balance_of(contract_address.contract_address);
    assert(contract_balance_before == 0, 'balance not up to date');

    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    let contract_balance_after = erc20_dispatcher.balance_of(contract_address.contract_address);
    assert(contract_balance_after == 1000000000000000000, 'balance not up to date');
}

#[test]
fn test_child_contract_creation() {}

#[test]
#[should_panic(expected: ('cummulative share not 100%',))]
fn test_create_group_invalid_percentage() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 30 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('member is less than 2',))]
fn test_create_group_too_few_members() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('list contain dublicate address',))]
fn test_create_group_duplicate_address() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);
}


#[test]
fn test_get_group_success() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup1", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher.transfer(ADMIN_ADDR(), 500000000000000000000000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(erc20_dispatcher.contract_address, ADMIN_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 20 });
    members.append(GroupMember { addr: USER3_ADDR(), percentage: 20 });
    start_cheat_caller_address(contract_address.contract_address, ADMIN_ADDR());
    contract_address.create_group("TestGroup2", 1000, members, token);
    // Should succeed for admin and
    let group1 = contract_address.get_group(1);
    stop_cheat_caller_address(contract_address.contract_address);
    let group2 = contract_address.get_group(2);
    assert(group1.name == "TestGroup1", 'Wrong group name');
    assert(group2.name == "TestGroup2", 'Wrong group name');

    let group_members1 = contract_address.get_group_member(1);
    let group_members2 = contract_address.get_group_member(2);

    assert(group_members1.len() == 2, 'len not 2');
    assert(group_members2.len() == 3, 'len not 3');

    // check how number of group an address is part of
    let has_share_in_group1 = contract_address.get_address_groups(USER3_ADDR());
    let has_share_in_group2 = contract_address.get_address_groups(USER1_ADDR());
    let has_share_in_group3 = contract_address.get_address_groups(USER2_ADDR());
    let has_share_in_group4 = contract_address.get_address_groups(CREATOR_ADDR());

    assert(has_share_in_group1.len() == 1, 'has share in only one group');
    assert(has_share_in_group2.len() == 2, 'has share in only two group');
    assert(has_share_in_group3.len() == 2, 'has share in only two group');
    assert(has_share_in_group4.len() == 0, 'has no share in only any group');
}


// ================ Upgrade Function Tests ================

// ================ Upgrade Function Tests ================

#[test]
fn test_upgradability() {
    // first declaration of AutoShare contract
    let contract = declare("AutoShare").unwrap().contract_class();
    let child_contract: ClassHash = *declare("AutoshareChild").unwrap().contract_class().class_hash;

    let constructor_calldata = array![
        ADMIN_ADDR().into(),
        TOKEN_ADDR().into(),
        EMERGENCY_WITHDRAW_ADDR().into(),
        child_contract.into(),
    ];

    // deployment of the contract
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

    let instance = IAutoShareDispatcher { contract_address };
    // declaring for a new class hash
    let new_class_hash = declare("AutoShare").unwrap().contract_class().class_hash;
    start_cheat_caller_address(contract_address, ADMIN_ADDR());
    instance.upgrade(*new_class_hash);
}


#[test]
#[should_panic]
fn test_upgradability_should_fail_if_not_owner_tries_to_update() {
    let contract = declare("AutoShare").unwrap().contract_class();
    let constructor_calldata = array![ADMIN_ADDR().into(), TOKEN_ADDR().into()];

    // deployment of the contract
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

    let instance = IAutoShareDispatcher { contract_address };
    // declaring for a new class hash
    let new_class_hash = declare("AutoShare").unwrap().contract_class().class_hash;

    // change caller to another person
    start_cheat_caller_address(contract_address, USER1_ADDR());
    instance.upgrade(*new_class_hash);
}

#[test]
fn test_token_data() {
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();
    let balance_of_user = erc20_dispatcher.balance_of(CREATOR_ADDR().into());
    assert(balance_of_user == 900_000_000_000_000_000_000_000_000_000_000, 'Wrong balance');

    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR().into());
    println!("balance of user: {}", erc20_dispatcher.balance_of(CREATOR_ADDR().into()));
    erc20_dispatcher.transfer(USER1_ADDR().into(), 100_000_000_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    let balance_of_user = erc20_dispatcher.balance_of(CREATOR_ADDR().into());
    assert(balance_of_user == 800_000_000_000_000_000_000_000_000_000_000, 'Wrong balance');
    let balance_of_user1 = erc20_dispatcher.balance_of(USER1_ADDR().into());
    assert(balance_of_user1 == 100_000_000_000_000_000_000_000_000_000_000, 'Wrong balance');
}

#[test]
fn test_get_all_groups_and_get_groups_by_paid() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Approve and create 3 groups
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    // Group 1: is_paid = false (default)
    let mut members1 = ArrayTrait::new();
    members1.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members1.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.create_group("Group1", 1000, members1, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Group 2: is_paid = false (default)
    let mut members2 = ArrayTrait::new();
    members2.append(GroupMember { addr: USER2_ADDR(), percentage: 50 });
    members2.append(GroupMember { addr: USER3_ADDR(), percentage: 50 });
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.create_group("Group2", 2000, members2, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Group 3: is_paid = false (default)
    let mut members3 = ArrayTrait::new();
    members3.append(GroupMember { addr: USER1_ADDR(), percentage: 10 });
    members3.append(GroupMember { addr: USER3_ADDR(), percentage: 90 });
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.create_group("Group3", 3000, members3, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Test get_all_groups
    let all_groups = contract_address.get_all_groups();
    assert(all_groups.len() == 3_u32, 'Should return all 3 groups');
    assert(all_groups.at(0).name == @"Group1", 'First group name mismatch');
    assert(all_groups.at(1).name == @"Group2", 'Second group name mismatch');
    assert(all_groups.at(2).name == @"Group3", 'Third group name mismatch');

    // Test get_groups_by_paid(false) - should return all groups since all are unpaid
    let unpaid_groups = contract_address.get_groups_by_paid(false);
    assert(unpaid_groups.len() == 3_u32, 'Should return 3 unpaid groups');
    assert(unpaid_groups.at(0).name == @"Group1", 'Unpaid group 1 name mismatch');
    assert(unpaid_groups.at(1).name == @"Group2", 'Unpaid group 2 name mismatch');
    assert(unpaid_groups.at(2).name == @"Group3", 'Unpaid group 3 name mismatch');

    // Test get_groups_by_paid(true) - should return empty array since no groups are paid
    let paid_groups = contract_address.get_groups_by_paid(true);
    assert(paid_groups.len() == 0_u32, 'Should return zerro');
}

#[test]
fn test_get_all_groups_empty() {
    let (contract_address, _erc20_dispatcher) = deploy_autoshare_contract();

    // Test get_all_groups when no groups exist
    let all_groups = contract_address.get_all_groups();
    assert(all_groups.len() == 0_u32, 'Should be zero');

    // Test get_groups_by_paid when no groups exist
    let unpaid_groups = contract_address.get_groups_by_paid(false);
    assert(unpaid_groups.len() == 0_u32, 'Should be zero');

    let paid_groups = contract_address.get_groups_by_paid(true);
    assert(paid_groups.len() == 0_u32, 'Should be zero ');
}

#[test]
fn test_pay_logicq() {
    // deploy the contract
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // assert the balance of the contract before was 0 - ie no creation fee collected
    let mut contract_balance = erc20_dispatcher.balance_of(contract_address.contract_address);
    let mut creator_balance_before = erc20_dispatcher
        .balance_of(CREATOR_ADDR().into()); // creator has all the token
    let mut user1_balance = erc20_dispatcher
        .balance_of(USER1_ADDR().into()); // user 1 doesnt have anything 
    let mut user2_balance = erc20_dispatcher
        .balance_of(USER2_ADDR().into()); // user 2 doesnt have anything

    assert(contract_balance == 0, 'balance not up to date');
    assert(
        creator_balance_before == 900_000_000_000_000_000_000_000_000_000_000,
        'creator balance not up to date',
    );
    assert(user1_balance == 0, 'user1 balance not up to date');
    assert(user2_balance == 0, 'user2 balance not up to date');

    // approve the main contract to take 1 strk as fee
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher.approve(contract_address.contract_address, 1_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    // create the group
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());

    let members: Array<GroupMember> = array![
        GroupMember { addr: USER1_ADDR(), percentage: 60 },
        GroupMember { addr: USER2_ADDR(), percentage: 40 },
    ];

    // create the group - depreciated feature of amount 1000 will not be used with child contract
    contract_address.create_group("TestGroup", 1000, members, erc20_dispatcher.contract_address);

    let group_address = contract_address.get_group_address(1);
    // assert the balance is default 0
    let mut child_contract_balance = erc20_dispatcher.balance_of(group_address);
    assert(child_contract_balance == 0, 'child not up to date');

    // instantiate the child contract
    let child_contract_instance = IAutoshareChildDispatcher { contract_address: group_address };

    // this would be automated by the backend admin will set main contract address and approve the
    // main contract to spend the tokens
    start_cheat_caller_address(group_address, ADMIN_ADDR());
    // set the main contract address
    child_contract_instance.set_main_contract_address(contract_address.contract_address);
    // approve the main contract to spend the tokens
    child_contract_instance.approve_main_contract();
    stop_cheat_caller_address(group_address);

    // transfer 1000 strk to the child contract address created for the group
    //(indexer would watch for this and trigger the pay function)
    // can be transferred by anyone
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    // transfer 1000 strk to the child contract address created for the group
    erc20_dispatcher.transfer(group_address, 1_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    // get the balance of the child contract
    child_contract_balance = erc20_dispatcher.balance_of(group_address);
    assert(
        child_contract_balance == 1_000_000_000_000_000_000_000, 'child balance incorrect',
    );
    let creator_balance_after = erc20_dispatcher.balance_of(CREATOR_ADDR().into());
    assert(
        creator_balance_after == creator_balance_before
            - 1_000_000_000_000_000_000_000
            - 1_000_000_000_000_000_000,
        'creator balance not up to date' // 1k strk for payment to contract and 1 strk for creation fee 
    );

    // pay the group
    contract_address.pay(1);

    let user1_balance_after = erc20_dispatcher.balance_of(USER1_ADDR().into());
    let user2_balance_after = erc20_dispatcher.balance_of(USER2_ADDR().into());

    assert(
        user1_balance_after == user1_balance + 600_000_000_000_000_000_000,
        'user1 balance not up to date',
    );
    assert(
        user2_balance_after == user2_balance + 400_000_000_000_000_000_000,
        'user2 balance not up to date',
    );

    let group = contract_address.get_group(1);
    assert(group.is_paid, 'group is not paid');
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('Group not found',))]
fn test_request_group_update_group_not_found() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Setup: Approve tokens
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    // Try to request update for non-existent group
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER2_ADDR(), percentage: 50 });

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.request_group_update(999, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('caller is not creator',))]
fn test_request_group_update_not_creator() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Create a group
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Try to request update as non-creator
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER2_ADDR(), percentage: 50 });

    start_cheat_caller_address(contract_address.contract_address, USER1_ADDR());
    contract_address.request_group_update(1, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('total percentage must be 100',))]
fn test_request_group_update_invalid_percentage() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Create a group
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Try to request update with invalid percentage
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER2_ADDR(), percentage: 30 }); // Total: 80%

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.request_group_update(1, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('list contain duplicate address',))]
fn test_request_group_update_duplicate_address() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Setup: Create a group
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Try to request update with duplicate addresses
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 }); // Duplicate address

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.request_group_update(1, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
// #[should_panic(expected: ('caller is not a group member',))]
fn test_request_group_update_not_member() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher.transfer(USER3_ADDR(), 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    // Create a group with USER3 as creator but not as member
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, USER3_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, USER3_ADDR());
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Try to request update as creator but not member (USER3 is creator but not in members list)
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER2_ADDR(), percentage: 50 });

    start_cheat_caller_address(contract_address.contract_address, USER3_ADDR());
    contract_address.request_group_update(1, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
fn test_approve_group_update_success() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // create a group
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: CREATOR_ADDR(), percentage: 65 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 35 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // request group update
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: CREATOR_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER3_ADDR(), percentage: 25 });
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 25 });

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.request_group_update(1, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);

    // approve group update (need 2 approvals since total_members = 2)
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.approve_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    // approve with second member
    start_cheat_caller_address(contract_address.contract_address, USER2_ADDR());
    contract_address.approve_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    // execute the group update (this actually updates the group name and amount)
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.execute_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    // check group update
    let group = contract_address.get_group(1);
    assert(group.name == "UpdatedGroup", 'Name not updated');
    assert(group.amount == 2000, 'Amount updated');
    assert(group.is_paid == false, 'is_paid updated');
    // // check group members
    let group_members = contract_address.get_group_member(1);
    assert(group_members.len() == 3, 'Group members not updated');
    assert(*group_members.at(0).addr == CREATOR_ADDR(), 'creator not in group');
    assert(*group_members.at(1).addr == USER3_ADDR(), 'User3 not in group');
    assert(*group_members.at(0).percentage == 50, 'creator percentage not updated');
    assert(*group_members.at(1).percentage == 25, 'User3 percentage not updated');

    // check how number of group an address is part of
    let has_share_in_group = contract_address.get_address_groups(USER3_ADDR());
    assert(has_share_in_group.len() == 1, 'has share in only one group');
}

#[test]
fn test_execute_group_update_success() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Create a group with creator as member
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: CREATOR_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 30 });
    members.append(GroupMember { addr: USER3_ADDR(), percentage: 10 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Request group update
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER2_ADDR(), percentage: 45 });
    new_members.append(GroupMember { addr: USER3_ADDR(), percentage: 5 });

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.request_group_update(1, "GroupUpdateSuccess", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);

    // Approve with all members
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.approve_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    start_cheat_caller_address(contract_address.contract_address, USER2_ADDR());
    contract_address.approve_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    start_cheat_caller_address(contract_address.contract_address, USER3_ADDR());
    contract_address.approve_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    // Execute the group update
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.execute_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    // Verify the group was updated correctly
    let group = contract_address.get_group(1);
    assert(group.name == "GroupUpdateSuccess", 'Name not updated');
    assert(group.amount == 2000, 'Amount not updated');
    assert(group.is_paid == false, 'is_paid should reset to false');
}

#[test]
#[should_panic(expected: ('caller is not the group creator',))]
fn test_execute_group_update_not_creator() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Create a group
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: CREATOR_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Request and approve update
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER2_ADDR(), percentage: 50 });

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.request_group_update(1, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.approve_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    start_cheat_caller_address(contract_address.contract_address, USER2_ADDR());
    contract_address.approve_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);

    // Try to execute as non-creator
    start_cheat_caller_address(contract_address.contract_address, USER1_ADDR());
    contract_address.execute_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('no pending updt for this group',))]
fn test_execute_group_update_not_completed() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Create a group
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: CREATOR_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Request update but don't approve
    let mut new_members = ArrayTrait::new();
    new_members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    new_members.append(GroupMember { addr: USER2_ADDR(), percentage: 50 });

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.request_group_update(1, "UpdatedGroup", 2000, new_members);
    stop_cheat_caller_address(contract_address.contract_address);

    // Try to execute without approvals
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.execute_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);
}

#[test]
#[should_panic(expected: ('update request not completed',))]
fn test_execute_group_update_no_pending_update() {
    let token = TOKEN_ADDR();
    let (contract_address, erc20_dispatcher) = deploy_autoshare_contract();

    // Create a group
    let mut members = ArrayTrait::new();
    start_cheat_caller_address(erc20_dispatcher.contract_address, CREATOR_ADDR());
    erc20_dispatcher
        .approve(contract_address.contract_address, 100_000_000_000_000_000_000_000_000);
    stop_cheat_caller_address(erc20_dispatcher.contract_address);

    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    members.append(GroupMember { addr: CREATOR_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract_address.contract_address);

    // Try to execute without any update request
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.execute_group_update(1);
    stop_cheat_caller_address(contract_address.contract_address);
}
