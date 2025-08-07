use starknet::ClassHash;
use contract::base::types::GroupMember;
use contract::interfaces::iautoshare_parent::{IAutoShareParentDispatcher, IAutoShareParentDispatcherTrait};
use contract::interfaces::iautoshare_child::{IAutoshareChildDispatcher, IAutoshareChildDispatcherTrait};
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

fn deploy_autoshare_parent_contract() -> (IAutoShareParentDispatcher, IERC20Dispatcher) {
    let erc20_class = declare("STARKTOKEN").unwrap().contract_class();
    let mut calldata = array![CREATOR_ADDR().into(), CREATOR_ADDR().into(), 6];
    let (erc20_address, _) = erc20_class.deploy(@calldata).unwrap();
    let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_address };

    let child_contract: ClassHash = *declare("AutoshareChild").unwrap().contract_class().class_hash;

    let contract = declare("AutoShareParent").unwrap().contract_class();
    let constructor_calldata = array![ADMIN_ADDR().into(), erc20_address.into(), child_contract.into()];
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

    let AutoShareParent = IAutoShareParentDispatcher { contract_address };
    (AutoShareParent, erc20_dispatcher)
}

#[test]
fn test_create_group_success_of_parent() {

    let (contract_address, erc20_dispatcher) = deploy_autoshare_parent_contract();
    let token = erc20_dispatcher.contract_address;
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

    let group_address = contract_address.get_group_address(1);
    let group = contract_address.get_group(1);
    assert(group.id == 1, 'group id is not 1');
    assert(group.name == "TestGroup", 'group name is not TestGroup');
    assert(group.amount == 1000, 'group amount is not 1000');
    assert(group.creator == CREATOR_ADDR(), 'group creator is not creator');
    println!("group_address: {:?}", group_address);

    let autoshare_child = IAutoshareChildDispatcher { contract_address: group_address };
    let group_members = autoshare_child.get_group_member(1);
    assert(group_members.len() == 2, 'group members length is not 2');
    assert(*group_members.at(0).addr == USER1_ADDR(), 'invalid member 0 address');
    assert(*group_members.at(0).percentage == 60, 'invalid member 0 percentage');
    assert(*group_members.at(1).addr == USER2_ADDR(), 'invalid member 1 address');
    assert(*group_members.at(1).percentage == 40, 'invalid member 1 percentage');

    let balance_before = erc20_dispatcher.balance_of(group_address);
    println!("balance_before: {:?}", balance_before);
}

