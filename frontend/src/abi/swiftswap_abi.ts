import { Abi } from "starknet";

export const SWIFTSWAP_ABI: Abi = [
  {
    type: "impl",
    name: "autoshare",
    interface_name: "contract::interfaces::iautoshare::IAutoShare",
  },
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      {
        name: "data",
        type: "core::array::Array::<core::bytes_31::bytes31>",
      },
      {
        name: "pending_word",
        type: "core::felt252",
      },
      {
        name: "pending_word_len",
        type: "core::integer::u32",
      },
    ],
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      {
        name: "low",
        type: "core::integer::u128",
      },
      {
        name: "high",
        type: "core::integer::u128",
      },
    ],
  },
  {
    type: "struct",
    name: "contract::base::types::GroupMember",
    members: [
      {
        name: "addr",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "percentage",
        type: "core::integer::u8",
      },
    ],
  },
  {
    type: "struct",
    name: "contract::base::types::Group",
    members: [
      {
        name: "id",
        type: "core::integer::u256",
      },
      {
        name: "name",
        type: "core::byte_array::ByteArray",
      },
      {
        name: "amount",
        type: "core::integer::u256",
      },
      {
        name: "creator",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "interface",
    name: "contract::interfaces::iautoshare::IAutoShare",
    items: [
      {
        type: "function",
        name: "create_group",
        inputs: [
          {
            name: "name",
            type: "core::byte_array::ByteArray",
          },
          {
            name: "amount",
            type: "core::integer::u256",
          },
          {
            name: "members",
            type: "core::array::Array::<contract::base::types::GroupMember>",
          },
          {
            name: "token_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_group",
        inputs: [
          {
            name: "group_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "contract::base::types::Group",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "upgrade",
        inputs: [
          {
            name: "new_class_hash",
            type: "core::starknet::class_hash::ClassHash",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      {
        name: "admin",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "event",
    name: "contract::base::events::GroupCreated",
    kind: "struct",
    members: [
      {
        name: "group_id",
        type: "core::integer::u256",
        kind: "data",
      },
      {
        name: "creator",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "name",
        type: "core::byte_array::ByteArray",
        kind: "data",
      },
      {
        name: "amount",
        type: "core::integer::u256",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
    kind: "struct",
    members: [
      {
        name: "class_hash",
        type: "core::starknet::class_hash::ClassHash",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "Upgraded",
        type: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "contract::autoshare::AutoShare::Event",
    kind: "enum",
    variants: [
      {
        name: "GroupCreated",
        type: "contract::base::events::GroupCreated",
        kind: "nested",
      },
      {
        name: "UpgradeableEvent",
        type: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
        kind: "flat",
      },
    ],
  },
];