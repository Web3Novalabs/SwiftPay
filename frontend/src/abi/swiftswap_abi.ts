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
    type: "enum",
    name: "core::bool",
    variants: [
      {
        name: "False",
        type: "()",
      },
      {
        name: "True",
        type: "()",
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
        name: "usage_limit_reached",
        type: "core::bool",
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
            name: "members",
            type: "core::array::Array::<contract::base::types::GroupMember>",
          },
          {
            name: "token_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
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
        name: "get_group_address",
        inputs: [
          {
            name: "group_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_all_groups",
        inputs: [],
        outputs: [
          {
            type: "core::array::Array::<contract::base::types::Group>",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_groups_by_paid",
        inputs: [
          {
            name: "usage_limit_reached",
            type: "core::bool",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<contract::base::types::Group>",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_group_member",
        inputs: [
          {
            name: "group_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<contract::base::types::GroupMember>",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_address_groups",
        inputs: [
          {
            name: "address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<contract::base::types::Group>",
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
      {
        type: "function",
        name: "pay",
        inputs: [
          {
            name: "group_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_group_balance",
        inputs: [
          {
            name: "group_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "request_group_update",
        inputs: [
          {
            name: "group_id",
            type: "core::integer::u256",
          },
          {
            name: "new_name",
            type: "core::byte_array::ByteArray",
          },
          {
            name: "new_members",
            type: "core::array::Array::<contract::base::types::GroupMember>",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "approve_group_update",
        inputs: [
          {
            name: "group_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "execute_group_update",
        inputs: [
          {
            name: "group_id",
            type: "core::integer::u256",
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
      {
        name: "token_address",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "emergency_withdraw_address",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "child_contract_class_hash",
        type: "core::starknet::class_hash::ClassHash",
      },
    ],
  },
  {
    type: "event",
    name: "contract::base::events::GroupCreated",
    kind: "struct",
    members: [
      {
        name: "group_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
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
    ],
  },
  {
    type: "event",
    name: "contract::base::events::GroupUpdateRequested",
    kind: "struct",
    members: [
      {
        name: "group_id",
        type: "core::integer::u256",
        kind: "key",
      },
      {
        name: "requester",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "new_name",
        type: "core::byte_array::ByteArray",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "contract::base::events::GroupUpdateApproved",
    kind: "struct",
    members: [
      {
        name: "group_id",
        type: "core::integer::u256",
        kind: "key",
      },
      {
        name: "approver",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "approval_count",
        type: "core::integer::u8",
        kind: "data",
      },
      {
        name: "total_members",
        type: "core::integer::u8",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "contract::base::events::GroupUpdated",
    kind: "struct",
    members: [
      {
        name: "group_id",
        type: "core::integer::u256",
        kind: "key",
      },
      {
        name: "old_name",
        type: "core::byte_array::ByteArray",
        kind: "data",
      },
      {
        name: "new_name",
        type: "core::byte_array::ByteArray",
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
    name: "contract::base::events::GroupPaid",
    kind: "struct",
    members: [
      {
        name: "group_id",
        type: "core::integer::u256",
        kind: "key",
      },
      {
        name: "amount",
        type: "core::integer::u256",
        kind: "data",
      },
      {
        name: "paid_by",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "paid_at",
        type: "core::integer::u64",
        kind: "data",
      },
      {
        name: "members",
        type: "core::array::Array::<contract::base::types::GroupMember>",
        kind: "data",
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
        name: "GroupUpdateRequested",
        type: "contract::base::events::GroupUpdateRequested",
        kind: "nested",
      },
      {
        name: "GroupUpdateApproved",
        type: "contract::base::events::GroupUpdateApproved",
        kind: "nested",
      },
      {
        name: "GroupUpdated",
        type: "contract::base::events::GroupUpdated",
        kind: "nested",
      },
      {
        name: "UpgradeableEvent",
        type: "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
        kind: "flat",
      },
      {
        name: "GroupPaid",
        type: "contract::base::events::GroupPaid",
        kind: "nested",
      },
    ],
  },
];