use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use infernos::config::schema::{NodeConfig, PricingConfig};
use infernos::node::api::routes::create_routes;
use infernos::node::api::AppState;
use infernos::node::gate::challenge::L402Challenge;
use infernos::node::gate::{MacaroonService, SessionBudgetManager};
use infernos::node::lightning::backend::MockLightningBackend;
use infernos::node::proxy::openai::OpenAiProxy;
use serde_json::json;
use std::sync::Arc;
use tower::ServiceExt; // for `oneshot`
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

fn setup_app() -> axum::Router {
    let config = NodeConfig {
        server: infernos::config::schema::ServerConfig {
            host: "127.0.0.1".to_string(),
            port: 8080,
        },
        pricing: PricingConfig {
            default_price_sats: infernos::common::types::Satoshis(10),
        },
        upstream: infernos::config::schema::UpstreamConfig {
            url: "http://localhost:8080".to_string(),
        },
        lightning: infernos::config::schema::LightningConfig::default(),
        data_dir: ".infernos_test_data".to_string(),
    };

    let proxy = OpenAiProxy::new(config.upstream.url.clone());

    let state = AppState {
        config: Arc::new(config),
        lightning: Arc::new(MockLightningBackend::new()),
        budget_manager: Arc::new(SessionBudgetManager::new()),
        macaroon_service: Arc::new(MacaroonService::new(
            b"test-secret-key-0000000000000000".to_vec(),
            "infernos-node",
        )),
        proxy,
    };

    create_routes(state)
}

#[tokio::test]
async fn test_health_endpoint() {
    let app = setup_app();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_models_endpoint() {
    let app = setup_app();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v1/models")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_chat_completions_requires_payment() {
    let app = setup_app();

    let req_body = json!({
        "model": "llama3.2",
        "messages": [{"role": "user", "content": "Hello"}]
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/chat/completions")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&req_body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    // A missing or invalid Authorization header should trigger a 402 Payment Required
    assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);

    // It must NOT return a WWW-Authenticate header, it just tells the user to create a session
    let auth_header = response.headers().get("WWW-Authenticate");
    assert!(auth_header.is_none());
}

#[tokio::test]
async fn test_new_session_endpoint_returns_challenge() {
    let app = setup_app();

    let req_body = json!({
        "budget_sats": 1000
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/session/new")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&req_body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    // The endpoint should initially return a 402 challenge with the required invoice for the budget
    assert_eq!(response.status(), StatusCode::PAYMENT_REQUIRED);

    let auth_header = response.headers().get("WWW-Authenticate");
    assert!(auth_header.is_some());
}

#[tokio::test]
async fn test_api_e2e_flow_with_budget_debit() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/v1/chat/completions"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({"response": "ok"})))
        .mount(&mock_server)
        .await;

    let config = NodeConfig {
        server: infernos::config::schema::ServerConfig {
            host: "127.0.0.1".to_string(),
            port: 8080,
        },
        pricing: PricingConfig {
            default_price_sats: infernos::common::types::Satoshis(10),
        },
        upstream: infernos::config::schema::UpstreamConfig {
            url: mock_server.uri(),
        },
        lightning: infernos::config::schema::LightningConfig::default(),
        data_dir: ".infernos_test_data".to_string(),
    };

    let proxy = OpenAiProxy::new(config.upstream.url.clone());
    let lightning = Arc::new(MockLightningBackend::new());

    let state = AppState {
        config: Arc::new(config),
        lightning: lightning.clone(),
        budget_manager: Arc::new(SessionBudgetManager::new()),
        macaroon_service: Arc::new(MacaroonService::new(
            b"test-secret-key-0000000000000000".to_vec(),
            "infernos-node",
        )),
        proxy,
    };

    let macaroon_service = state.macaroon_service.clone();
    let app = create_routes(state);

    // 1. Session New
    let req_body = json!({
        "budget_sats": 500
    });
    let response1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/session/new")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&req_body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response1.status(), StatusCode::PAYMENT_REQUIRED);
    let auth_header = response1
        .headers()
        .get("WWW-Authenticate")
        .unwrap()
        .to_str()
        .unwrap();
    let challenge = L402Challenge::from_header_value(auth_header).unwrap();

    // 2. Because MockLightningBackend creates a UUID payment hash, we cannot find its preimage.
    // To test the API natively, we extract the session ID from the challenge,
    // generate a known preimage/hash pair, settle it, and re-mint a valid macaroon.
    let preimage_bytes = [0x5au8; 32];
    let preimage_hex = hex::encode(preimage_bytes);
    let known_payment_hash =
        infernos::node::gate::verify::L402Verifier::hash_preimage(&preimage_hex).unwrap();

    lightning.simulate_payment(&known_payment_hash).await;

    // Extract the original session to keep the flow valid
    let decoded_macaroon =
        infernos::node::gate::macaroon::Macaroon::from_base64(&challenge.macaroon).unwrap();
    let (session_opt, budget_opt) =
        infernos::node::gate::budget::SessionBudgetManager::extract_session_caveats(
            &decoded_macaroon,
        );
    let session_uuid = session_opt.unwrap().0.to_string();
    let budget_val = budget_opt.unwrap().0;

    // Remint valid macaroon
    let macaroon_obj = macaroon_service
        .mint(
            &known_payment_hash,
            vec![
                infernos::node::gate::macaroon::Caveat::Session(session_uuid),
                infernos::node::gate::macaroon::Caveat::Budget(budget_val),
            ],
        )
        .unwrap();

    let auth_val = format!(
        "L402 {}:{}",
        macaroon_obj.to_base64().unwrap(),
        preimage_hex
    );

    // 4. Send chat_completions
    let chat_body = json!({
        "model": "llama3.2",
        "messages": [{"role": "user", "content": "Hello"}]
    });

    let response2 = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/chat/completions")
                .header("Content-Type", "application/json")
                .header("Authorization", auth_val)
                .body(Body::from(serde_json::to_vec(&chat_body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    let status = response2.status();
    // With wiremock, it should be OK
    assert_eq!(status, StatusCode::OK, "Unexpected status: {}", status);

    let remaining_header = response2.headers().get("X-Infernos-Remaining-Budget-Sats");
    assert!(remaining_header.is_some());
    assert_eq!(remaining_header.unwrap().to_str().unwrap(), "490"); // 500 - 10
}
