// use autoswappr_backend::utils::starknet::{approve_token, get_allowance, revoke_token};
// use std::time::Duration;
// use std::{env, thread};

// const TOKEN: &str = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // STRK token

// #[tokio::test]
// async fn test_allowance_check() {
//     // Load .env file
//     dotenvy::dotenv().ok();

//     // Verify environment variables
//     let p = env::var("RPC_URL").expect("RPC_URL must be set in .env");
//     println!("key: ", {p});
//     env::var("CONTRACT_ADDRESS").expect("CONTRACT_ADDRESS must be set in .env");
//     let owner = env::var("OWNER_ADDRESS").expect("OWNER_ADDRESS NOT PROVIDED");

//     let result = get_allowance(owner.as_str(), TOKEN).await;
//     // Assert success

//     assert!(result.is_ok(), "Expected Ok, got {:#?}", result);
// }