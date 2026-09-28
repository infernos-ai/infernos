pub mod handlers;
pub mod routes;

use crate::config::schema::NodeConfig;
use crate::node::gate::{MacaroonService, SessionBudgetManager};
use crate::node::lightning::backend::LightningBackend;
use crate::node::pricing::PricingCalculator;
use crate::node::proxy::openai::OpenAiProxy;
use std::sync::atomic::AtomicU64;
use std::sync::Arc;

#[derive(Default)]
pub struct NodeStats {
    pub total_requests: AtomicU64,
    pub total_sats_earned: AtomicU64,
}

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<NodeConfig>,
    pub lightning: Arc<dyn LightningBackend>,
    pub budget_manager: Arc<SessionBudgetManager>,
    pub macaroon_service: Arc<MacaroonService>,
    pub proxy: OpenAiProxy,
    pub stats: Arc<NodeStats>,
}

impl AppState {
    pub fn pricing_calculator(&self) -> PricingCalculator {
        PricingCalculator::new(self.config.pricing.clone())
    }
}
