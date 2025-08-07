use contract::base::errors::{
    ERR_DUPLICATE_ADDRESS, ERR_GROUP_NOT_FOUND, ERR_INVALID_PERCENTAGE_SUM, ERR_TOO_FEW_MEMBERS,
    ERR_UNAUTHORIZED,
};
use contract::base::types::GroupMember;
use contract::interfaces::iautoshare_parent::{IAutoShareParentDispatcher, IAutoShareParentDispatcherTrait};
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
// fn deploy_autoshare_parent_contract() -> (IAutoShareParentDispatcher, IERC20Dispatcher) {
//     let erc20_class = declare("STARKTOKEN").unwrap().contract_class();
//     let mut calldata = array![CREATOR_ADDR().into(), CREATOR_ADDR().into(), 6];
//     let (erc20_address, _) = erc20_class.deploy(@calldata).unwrap();
//     let erc20_dispatcher = IERC20Dispatcher { contract_address: erc20_address };

//     let contract = declare("AutoShare").unwrap().contract_class();
//     let constructor_calldata = array![ADMIN_ADDR().into(), erc20_address.into()];
//     let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();

//     let AutoShare = IAutoShareDispatcher { contract_address };
//     (AutoShare, erc20_dispatcher)
// }