use crate::common::error::Result;
use crate::common::types::{PaymentHash, Satoshis};
use crate::node::lightning::invoice::Invoice;
use async_trait::async_trait;

use std::any::Any;

#[async_trait]
pub trait LightningBackend: Send + Sync + Any {
    fn as_any(&self) -> &dyn Any;
    async fn create_invoice(&self, amount_sats: Satoshis, memo: &str) -> Result<Invoice>;
    async fn is_invoice_settled(&self, payment_hash: &PaymentHash) -> Result<bool>;
}

