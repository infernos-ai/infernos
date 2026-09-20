use super::handlers;
use super::AppState;
use axum::{
    routing::{get, post},
    Router,
};

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        .route("/health", get(handlers::health_check))
        .route("/v1/models", get(handlers::models))
        .route("/v1/session/new", post(handlers::new_session))
        .route("/v1/chat/completions", post(handlers::chat_completions))
        .with_state(state)
}
