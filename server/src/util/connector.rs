use std::{env::var, sync::LazyLock};

use starknet::{
    accounts::{ExecutionEncoding, SingleOwnerAccount},
    core::{chain_id, types::Felt},
    providers::{
        Url,
        jsonrpc::{HttpTransport, JsonRpcClient},
    },
    signers::{LocalWallet, SigningKey},
};

pub const ADDRESS_PREFIX: &str = "0x";
pub const ADDRESS_LENGTH: usize = 66;

/// Returns true if the wallet address is valid.
pub fn is_valid_address(address: &str) -> bool {
    address.starts_with(ADDRESS_PREFIX)
        && address.len() == ADDRESS_LENGTH
        && address[2..].chars().all(|c| c.is_ascii_hexdigit())
}

static RPC_URL: LazyLock<String> = LazyLock::new(|| "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/Z-bu_aTuwBtbfy7YQ4vOS2ZPQgWJpZdw".to_string()); // var("RPC_URL").expect("RPC URL NOT PROVIDED")
static CONTRACT_ADDRESS: LazyLock<String> =
    LazyLock::new(|| "0x02cc3107900daff156c0888eccbcd901500f9bf440ab694e1eecc14f4641d1dc".to_string()); // var("CONTRACT_ADDRESS").expect("CONTRACT ADDRESS NOT PROVIDED")

fn rpc_provider() -> JsonRpcClient<HttpTransport> {
    JsonRpcClient::new(HttpTransport::new(Url::parse(&RPC_URL).unwrap()))
}

pub fn contract_address_felt() -> Felt {
    Felt::from_hex(&CONTRACT_ADDRESS).unwrap()
}

pub fn signer_account() -> SingleOwnerAccount<JsonRpcClient<HttpTransport>, LocalWallet> {
    let provider = rpc_provider();
    let private_key = "0x062e0c4dc96f3d877af48285a5442ce69860a50b11a1d91eae1e3f128df1c454"; // var("PRIVATE_KEY").unwrap()
    let public_key = "0x0305b969b430721cda31852d669cdc23b2e4cfc889ab0ed855f5c70ca2668e0a"; //var("PUBLIC_KEY").unwrap();

    let signer = LocalWallet::from(SigningKey::from_secret_scalar(
        Felt::from_hex(&private_key).unwrap(),
    ));
    let address = Felt::from_hex(&public_key).unwrap();
    SingleOwnerAccount::new(
        provider,
        signer,
        address,
        chain_id::SEPOLIA,
        ExecutionEncoding::New,
    )
}
