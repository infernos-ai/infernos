use crate::common::error::Result;
use crate::config::schema::NodeConfig;
use crate::node::api::routes::create_routes;
use crate::node::api::AppState;
use crate::node::gate::{MacaroonService, SessionBudgetManager};
use crate::node::lightning::backend::MockLightningBackend;
use crate::node::proxy::openai::OpenAiProxy;
use std::sync::Arc;
use tower_http::trace::TraceLayer;

pub struct InfernosServer {
    pub config: NodeConfig,
}

impl InfernosServer {
    pub fn new(config: NodeConfig) -> Self {
        Self { config }
    }

    pub async fn run(&self) -> Result<()> {
        self.run_until_shutdown(std::future::pending()).await
    }

    pub async fn run_until_shutdown<F>(&self, shutdown: F) -> Result<()>
    where
        F: std::future::Future<Output = ()> + Send + 'static,
    {
        let addr = format!("{}:{}", self.config.server.host, self.config.server.port);
        tracing::info!("Starting Infernos Node on {}", addr);

        let macaroon_key = Self::load_or_generate_macaroon_key(&self.config.data_dir)?;

        let proxy = OpenAiProxy::new(self.config.upstream.url.clone());

        let state = AppState {
            config: Arc::new(self.config.clone()),
            // Using MockLightningBackend by default to keep the implementation simple right now
            lightning: Arc::new(MockLightningBackend::new()),
            budget_manager: Arc::new(SessionBudgetManager::new()),
            macaroon_service: Arc::new(MacaroonService::new(macaroon_key, "infernos-node")),
            proxy,
        };

        let app = create_routes(state).layer(
            TraceLayer::new_for_http()
                .make_span_with(tower_http::trace::DefaultMakeSpan::new().include_headers(false)),
        );

        let listener = tokio::net::TcpListener::bind(&addr)
            .await
            .map_err(|e| crate::common::error::Error::Internal(e.to_string()))?;

        axum::serve(listener, app)
            .with_graceful_shutdown(shutdown)
            .await
            .map_err(|e| crate::common::error::Error::Internal(e.to_string()))?;

        Ok(())
    }

    fn load_or_generate_macaroon_key(data_dir: &str) -> Result<Vec<u8>> {
        use rand::RngCore;
        use std::fs;
        use std::path::Path;

        let data_path = Path::new(data_dir);
        if !data_path.exists() {
            fs::create_dir_all(data_path).map_err(|e| {
                crate::common::error::Error::Internal(format!(
                    "Failed to create data directory: {}",
                    e
                ))
            })?;
        }

        let key_path = data_path.join(".infernos_macaroon_key");

        if key_path.exists() {
            let key = fs::read(&key_path).map_err(|e| {
                crate::common::error::Error::Internal(format!("Failed to read macaroon key: {}", e))
            })?;
            if key.len() == 32 {
                return Ok(key);
            }
        }

        tracing::info!(
            "Generating new macaroon root key and saving to {}",
            key_path.display()
        );
        let mut key = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut key);

        fs::write(&key_path, key).map_err(|e| {
            crate::common::error::Error::Internal(format!(
                "Failed to persist Macaroon root key: {}",
                e
            ))
        })?;

        Ok(key.to_vec())
    }
}
