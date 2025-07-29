use contract::base::errors::{
    ERR_DUPLICATE_ADDRESS, ERR_INVALID_PERCENTAGE_SUM, ERR_TOO_FEW_MEMBERS, ERR_UNAUTHORIZED,
};
use contract::base::types::GroupMember;
use contract::interfaces::iautoshare::{IAutoShareDispatcher, IAutoShareDispatcherTrait};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
    stop_cheat_caller_address,
};
use starknet::ContractAddress;

const ADMIN_CONST: felt252 = 123;
const CREATOR_CONST: felt252 = 456;
const USER1_CONST: felt252 = 101112;
const USER2_CONST: felt252 = 131415;
const USER3_CONST: felt252 = 1314164;
const TOKEN_CONST: felt252 = 13141324;

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

// deploy the autoshare contract
fn deploy_autoshare_contract() -> (IAutoShareDispatcher, IERC20Dispatcher) {
    let erc20_class = declare("strktoken").unwrap().contract_class();
    let mut calldata = array![CREATOR_ADDR().into(), CREATOR_ADDR().into(), 6];
    let (erc20_address, _) = erc20_class.deploy(@calldata).unwrap();
    let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_address };

    let contract = declare("AutoShare").unwrap().contract_class();
    let constructor_calldata = array![ADMIN_ADDR().into(), erc20_address.into()];
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

    let AutoShare = IAutoShareDispatcher { contract_address };
    (AutoShare, erc20_dispatcher)
}


#[test]
fn test_create_group_success() {
    let token = TOKEN_ADDR();
    let (contract_address, _) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    contract_address.create_group("TestGroup", 1000, members, token);
}

#[test]
#[should_panic(expected: ('cummulative share not 100%',))]
fn test_create_group_invalid_percentage() {
    let token = TOKEN_ADDR();
    let (contract_address, _) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 30 });
    contract_address.create_group("TestGroup", 1000, members, token)
}

#[test]
#[should_panic(expected: ('member is less than 2',))]
fn test_create_group_too_few_members() {
    let token = TOKEN_ADDR();
    let (contract_address, _) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 100 });
    contract_address.create_group("TestGroup", 1000, members, token)
}

#[test]
#[should_panic(expected: ('list contsin dublicate address',))]
fn test_create_group_duplicate_address() {
    let token = TOKEN_ADDR();
    let (contract_address, _) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 50 });
    contract_address.create_group("TestGroup", 1000, members, token)
}

#[test]
#[should_panic(expected: ('only owner or admin',))]
fn test_get_group_unauthorized() {
    let token = TOKEN_ADDR();
    let (contract, _) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    start_cheat_caller_address(contract.contract_address, CREATOR_ADDR());
    contract.create_group("TestGroup", 1000, members, token);
    stop_cheat_caller_address(contract.contract_address);
    // Try to get group as unauthorized user
    contract.get_group(1);
}

#[test]
fn test_get_group_as_admin_or_creator() {
    let token = TOKEN_ADDR();
    let (contract_address, _) = deploy_autoshare_contract();
    let mut members = ArrayTrait::new();
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    start_cheat_caller_address(contract_address.contract_address, CREATOR_ADDR());
    contract_address.create_group("TestGroup", 1000, members, token);
    // Should succeed for creator
    let group_creator = contract_address.get_group(1);
    stop_cheat_caller_address(contract_address.contract_address);

    let mut members = ArrayTrait::new();
    members.append(GroupMember { addr: USER1_ADDR(), percentage: 60 });
    members.append(GroupMember { addr: USER2_ADDR(), percentage: 40 });
    start_cheat_caller_address(contract_address.contract_address, ADMIN_ADDR());
    contract_address.create_group("TestGroup", 1000, members, token);
    // Should succeed for admin and
    let group_admin = contract_address.get_group(2);
    stop_cheat_caller_address(contract_address.contract_address);
    assert(group_admin.name == "TestGroup", 'Wrong group name');
    assert(group_creator.name == "TestGroup", 'Wrong group name');
}


// ================ Upgrade Function Tests ================

// ================ Upgrade Function Tests ================

#[test]
fn test_upgradability() {
    // first declaration of AutoShare contract
    let contract = declare("AutoShare").unwrap().contract_class();
    let constructor_calldata = array![ADMIN_ADDR().into(), TOKEN_ADDR().into()];

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
