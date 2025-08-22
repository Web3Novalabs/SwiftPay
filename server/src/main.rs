use axum::{
    Router,
    http::{
        HeaderName, HeaderValue, Method, StatusCode,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
    routing::{get, post},
    http::{
        HeaderName, HeaderValue, Method, StatusCode,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
    routing::{get, post},
};

mod http;
mod util;
use http::request::new;

use crate::http::request::pay;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    let allowed_origins = {
        let mut origins = vec![
            HeaderValue::from_str("https://paymesh.app")
                .map_err(|e| eprintln!("Invalid origin: {}", e))
                .unwrap_or_else(|_| HeaderValue::from_static("https://paymesh.app")),
        ];

        // Only include localhost in development
        if cfg!(debug_assertions) {
            origins.push(
                HeaderValue::from_str("http://localhost:3000")
                    .map_err(|e| eprintln!("Invalid localhost origin: {}", e))
                    .unwrap_or_else(|_| HeaderValue::from_static("http://localhost:3000")),
            );
        }
        origins
    };

    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([
            CONTENT_TYPE,
            AUTHORIZATION,
            HeaderName::from_static("x-requested-with"),
        ])
        .allow_credentials(true);
    let allowed_origins = {
        let mut origins = vec![
            HeaderValue::from_str("https://paymesh.app")
                .map_err(|e| eprintln!("Invalid origin: {}", e))
                .unwrap_or_else(|_| HeaderValue::from_static("https://paymesh.app")),
        ];

        // Only include localhost in development
        if cfg!(debug_assertions) {
            origins.push(
                HeaderValue::from_str("http://localhost:3000")
                    .map_err(|e| eprintln!("Invalid localhost origin: {}", e))
                    .unwrap_or_else(|_| HeaderValue::from_static("http://localhost:3000")),
            );
        }
        origins
    };

    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([
            CONTENT_TYPE,
            AUTHORIZATION,
            HeaderName::from_static("x-requested-with"),
        ])
        .allow_credentials(true);
    // Read (development) Environment Variables.
    dotenvy::dotenv().ok();
    // build our application with a route
    let app = Router::new()
        .route("/", get(new))
        .route("/pay_member", post(pay))
        .layer(cors)
        .fallback(|| async { (StatusCode::UNAUTHORIZED, "UNAUTHORIZED ORIGIN") });

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
