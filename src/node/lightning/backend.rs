use crate::common::error::Result;
use crate::common::types::{PaymentHash, Satoshis};
use crate::node::lightning::invoice::Invoice;
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

#[async_trait]
pub trait LightningBackend: Send + Sync {
    async fn create_invoice(&self, amount_sats: Satoshis, memo: &str) -> Result<Invoice>;
    async fn is_invoice_settled(&self, payment_hash: &PaymentHash) -> Result<bool>;
}

#[derive(Clone)]
pub struct MockLightningBackend {
    settled_invoices: Arc<Mutex<HashMap<String, bool>>>,
}

impl Default for MockLightningBackend {
    fn default() -> Self {
        Self::new()
    }
}

impl MockLightningBackend {
    pub fn new() -> Self {
        Self {
            settled_invoices: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn simulate_payment(&self, payment_hash: &PaymentHash) {
        let mut lock = self.settled_invoices.lock().await;
        lock.insert(payment_hash.0.clone(), true);
    }
}

#[async_trait]
impl LightningBackend for MockLightningBackend {
    async fn create_invoice(&self, amount_sats: Satoshis, _memo: &str) -> Result<Invoice> {
        let payment_hash_str = Uuid::new_v4().to_string().replace("-", "");
        let invoice_str = format!("lnbc{}mock{}", amount_sats.0, payment_hash_str);

        let mut lock = self.settled_invoices.lock().await;
        lock.insert(payment_hash_str.clone(), false);

        Ok(Invoice {
            bolt11: invoice_str,
            payment_hash: PaymentHash(payment_hash_str),
            amount: amount_sats,
        })
    }

    async fn is_invoice_settled(&self, payment_hash: &PaymentHash) -> Result<bool> {
        let lock = self.settled_invoices.lock().await;
        let is_settled = lock.get(&payment_hash.0).copied().unwrap_or(false);
        Ok(is_settled)
    }
}
