import { useState } from 'react';
import { useWebLN } from '../hooks/useWebLN';

export function InvoiceModal({ invoice, onPaymentSuccess, onCancel }) {
  const { isAvailable, sendPayment } = useWebLN();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  // For the development mock flow
  const handleMockPay = async () => {
    setPaying(true);
    try {
      const res = await fetch("/internal/mock/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice })
      });
      if (!res.ok) throw new Error("Mock payment failed");
      const data = await res.json();
      onPaymentSuccess(data.preimage);
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  const handleWebLNPay = async () => {
    setPaying(true);
    setError(null);
    try {
      const preimage = await sendPayment(invoice);
      onPaymentSuccess(preimage);
    } catch (err) {
      setError("WebLN payment failed or was rejected.");
      setPaying(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-popover border border-border rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-2">402 Payment Required</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Please pay the Lightning Invoice to proceed.
        </p>
        
        <div className="bg-background border border-input rounded-lg p-4 font-mono text-xs break-all text-lightning mb-6">
          {invoice}
        </div>

        {error && (
          <p className="text-error text-sm mb-4 bg-error/10 p-3 rounded-md">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {isAvailable && (
            <button 
              onClick={handleWebLNPay}
              disabled={paying}
              className="w-full bg-lightning hover:bg-lightning/90 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying ? 'Processing...' : 'Pay with WebLN'}
            </button>
          )}

          {/* Development escape hatch */}
          <button 
            onClick={handleMockPay}
            disabled={paying}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border"
          >
            Dev: Mock Pay (Internal)
          </button>

          <button 
            onClick={onCancel}
            disabled={paying}
            className="w-full bg-transparent hover:bg-muted text-muted-foreground py-2 rounded-lg transition-colors disabled:opacity-50 mt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
