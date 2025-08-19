use axum::{
    Router,
    routing::{post,get},
};

 
mod http;
mod util;
use http::request::new;

use crate::http::request::pay;
#[tokio::main]
async fn main() {
    // Read (development) Environment Variables.
    dotenvy::dotenv().ok();
    // build our application with a route
    let app = Router::new()
        .route("/", get(new))
        .route("/pay_member", post(pay));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
