use base64::Engine;
use infernos::common::types::{PaymentHash, Satoshis};
use infernos::config::schema::{BitcoinNetwork, LightningBackendType, LightningConfig};
use infernos::node::lightning::backend::LightningBackend;
use infernos::node::lightning::lnd::LndBackend;
use reqwest::Client;
use serde_json::json;
use wiremock::matchers::{header, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn test_lnd_backend_create_invoice_success() {
    let mock_lnd = MockServer::start().await;

    let hash_bytes = [7u8; 32];
    let hash_b64 = base64::engine::general_purpose::STANDARD.encode(hash_bytes);
    let hash_hex = hex::encode(hash_bytes);
    let bolt11_inv = "lnbctest100n1pvjql8zpp5...";

    Mock::given(method("POST"))
        .and(path("/v1/invoices"))
        .and(header("Grpc-Metadata-macaroon", "deadbeef"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "r_hash": hash_b64,
            "payment_request": bolt11_inv,
            "add_index": "1"
        })))
        .mount(&mock_lnd)
        .await;

    let backend = LndBackend::new(mock_lnd.uri(), "deadbeef", Client::new());

    let invoice = backend
        .create_invoice(Satoshis(100), "Inference prompt")
        .await
        .expect("Failed to create invoice");

    assert_eq!(invoice.bolt11, bolt11_inv);
    assert_eq!(invoice.payment_hash.0, hash_hex);
    assert_eq!(invoice.amount, Satoshis(100));
}

#[tokio::test]
async fn test_lnd_backend_is_invoice_settled() {
    let mock_lnd = MockServer::start().await;

    let hash_bytes = [9u8; 32];
    let hash_hex = hex::encode(hash_bytes);
    let hash_b64url = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(hash_bytes);

    Mock::given(method("GET"))
        .and(path(format!("/v1/invoice/{}", hash_b64url)))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "settled": true,
            "state": "SETTLED"
        })))
        .mount(&mock_lnd)
        .await;

    let backend = LndBackend::new(mock_lnd.uri(), "deadbeef", Client::new());

    let settled = backend
        .is_invoice_settled(&PaymentHash(hash_hex))
        .await
        .expect("Failed to check settlement");

    assert!(settled);
}

#[tokio::test]
async fn test_lnd_backend_pay_invoice_success() {
    let mock_lnd = MockServer::start().await;

    let preimage_bytes = [42u8; 32];
    let preimage_b64 = base64::engine::general_purpose::STANDARD.encode(preimage_bytes);
    let preimage_hex = hex::encode(preimage_bytes);

    Mock::given(method("POST"))
        .and(path("/v1/channels/transactions"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "payment_preimage": preimage_b64,
            "payment_error": ""
        })))
        .mount(&mock_lnd)
        .await;

    let backend = LndBackend::new(mock_lnd.uri(), "deadbeef", Client::new());

    let preimage = backend
        .pay_invoice("lnbctest100n1...")
        .await
        .expect("Failed to pay invoice");

    assert_eq!(preimage, preimage_hex);
}

#[tokio::test]
async fn test_lnd_backend_missing_config_errors() {
    let config = LightningConfig {
        backend: LightningBackendType::Lnd,
        network: BitcoinNetwork::Testnet,
        lnd_rpc_host: None,
        lnd_macaroon_path: None,
        lnd_tls_cert_path: None,
        nwc_uri: None,
    };

    let result = LndBackend::from_config(&config);
    assert!(result.is_err());
    let err_str = result.err().unwrap().to_string();
    assert!(err_str.contains("Missing lnd_rpc_host") || err_str.contains("configuration"));
}
