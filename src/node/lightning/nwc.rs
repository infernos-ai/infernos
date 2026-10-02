use crate::common::error::{Error, Result};
use crate::common::types::{PaymentHash, Satoshis};
use crate::node::lightning::backend::LightningBackend;
use crate::node::lightning::invoice::Invoice;
use async_trait::async_trait;
use nostr::nips::nip47::{MakeInvoiceRequest, LookupInvoiceRequest, NostrWalletConnectUri};
use nwc::NostrWalletConnect;
use std::str::FromStr;

pub struct NwcLightningBackend {
    pub uri: NostrWalletConnectUri,
}

impl NwcLightningBackend {
    pub fn new(uri_str: String) -> Result<Self> {
        let uri = NostrWalletConnectUri::from_str(&uri_str).map_err(|e| {
            Error::Config(format!("Invalid NWC URI: {}", e))
        })?;
        Ok(Self { uri })
    }
}

#[async_trait]
impl LightningBackend for NwcLightningBackend {
    async fn create_invoice(&self, amount: Satoshis, description: &str) -> Result<Invoice> {
        let client = NostrWalletConnect::new(self.uri.clone());
        let req = MakeInvoiceRequest {
            amount: amount.0 * 1000, // millisats
            description: Some(description.to_string()),
            description_hash: None,
            expiry: None,
        };
        let invoice_res = client.make_invoice(req).await.map_err(|e| {
            Error::Lightning(format!("NWC make_invoice error: {}", e))
        })?;
        
        let payment_hash = invoice_res.payment_hash.ok_or_else(|| {
            Error::Lightning("NWC did not return a payment hash".to_string())
        })?;

        Ok(Invoice {
            bolt11: invoice_res.invoice,
            payment_hash: PaymentHash(payment_hash),
            amount,
        })
    }

    async fn is_invoice_settled(&self, payment_hash: &PaymentHash) -> Result<bool> {
        let client = NostrWalletConnect::new(self.uri.clone());
        let req = LookupInvoiceRequest {
            payment_hash: Some(payment_hash.0.clone()),
            invoice: None,
        };
        let lookup_res = client.lookup_invoice(req).await.map_err(|e| {
            Error::Lightning(format!("NWC lookup_invoice error: {}", e))
        })?;
        
        Ok(lookup_res.settled_at.is_some())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nwc_backend_invalid_uri_rejected() {
        let res = NwcLightningBackend::new("invalid_uri_format".to_string());
        assert!(res.is_err());
    }

    #[test]
    fn test_nwc_backend_valid_uri_parsing() {
        let valid_uri = "nostr+walletconnect://b889ff5b1513b641e2a139f661a661364979c5beee91842f8f0ef42ab558e9d4?relay=wss%3A%2F%2Frelay.damus.io&secret=71a8c14c1407c113601079c4302dab36460f0ccd0ad506f1f2dc73b5100e4f3c";
        let res = NwcLightningBackend::new(valid_uri.to_string());
        assert!(res.is_ok());
    }
}


