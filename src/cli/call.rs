use crate::client::budget::ClientBudgetTracker;
use crate::client::error::ClientError;
use crate::client::lib::InfernosClient;
use crate::client::openai::{ChatCompletionRequest, ChatMessage};
use crate::client::pay::LightningPaymentProvider;
use clap::Args;
use std::sync::Arc;

#[derive(Args, Debug)]
pub struct CallArgs {
    #[arg(long, default_value = "http://127.0.0.1:8080")]
    pub node: String,

    #[arg(long)]
    pub model: String,

    #[arg(long)]
    pub prompt: String,

    #[arg(long, default_value_t = 100)]
    pub budget: u64,
}

struct MockPaymentProvider {
    node_url: String,
    http_client: reqwest::Client,
}

impl MockPaymentProvider {
    fn new(node_url: String) -> Self {
        Self {
            node_url,
            http_client: reqwest::Client::new(),
        }
    }
}

#[async_trait::async_trait]
impl LightningPaymentProvider for MockPaymentProvider {
    async fn pay_invoice(&self, invoice: &str) -> Result<String, ClientError> {
        let url = format!("{}/internal/mock/pay", self.node_url.trim_end_matches('/'));

        let response = self
            .http_client
            .post(url)
            .json(&serde_json::json!({
                "invoice": invoice
            }))
            .send()
            .await
            .map_err(|e| ClientError::Protocol(format!("HTTP error: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();

            return Err(ClientError::Protocol(format!(
                "Mock payment failed with {}",
                status
            )));
        }

        let body: serde_json::Value = response
            .json()
            .await
            .map_err(|e| ClientError::Protocol(format!("JSON error: {}", e)))?;

        body["preimage"].as_str().map(str::to_owned).ok_or_else(|| {
            ClientError::Protocol("Mock payment response missing preimage".to_string())
        })
    }
}

pub async fn handle_call_command(args: CallArgs) {
    println!("Infernos\n──────────────────────────────");
    println!("Node:      {}", args.node);
    println!("Model:     {}", args.model);
    println!("Budget:    {} sats", args.budget);
    println!("Payment:   MOCK Lightning\n");

    let provider = Arc::new(MockPaymentProvider::new(args.node.clone()));
    let budget_tracker = Arc::new(ClientBudgetTracker::new(args.budget));

    let client = match InfernosClient::builder()
        .node_url(args.node.clone())
        .payment_provider(provider)
        .build()
    {
        Ok(c) => c.with_budget(budget_tracker.clone()),
        Err(e) => {
            eprintln!("Failed to initialize client: {}", e);
            return;
        }
    };

    // Session creation
    if let Err(e) = client.create_session(args.budget).await {
        eprintln!("Failed to create session: {}", e);
        return;
    }
    println!("✓ Session created");
    println!("✓ L402 authorization established");
    println!("✓ Inference request accepted\n");

    let req = ChatCompletionRequest {
        model: args.model,
        messages: vec![ChatMessage {
            role: "user".to_string(),
            content: args.prompt,
        }],
        stream: None,
    };

    println!("Response\n──────────────────────────────\n");

    match client.chat(&req).await {
        Ok(response) => {
            for choice in response.choices {
                println!("{}", choice.message.content);
            }

            println!("\n──────────────────────────────");
            let spent = args.budget.saturating_sub(budget_tracker.remaining());
            println!("Charged:    {} sats", spent);
            println!("Remaining:  {} sats", budget_tracker.remaining());
        }
        Err(e) => {
            eprintln!("Inference request failed: {}", e);
        }
    }
}
