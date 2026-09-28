import { useState, useEffect } from 'react';

/**
 * Hook to detect and interact with a WebLN provider (e.g. Alby).
 */
export function useWebLN() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [webln, setWebln] = useState(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const checkWebLN = () => {
      if (typeof window !== 'undefined' && window.webln) {
        setIsAvailable(true);
        setWebln(window.webln);
      } else {
        setIsAvailable(false);
      }
    };

    // Check immediately
    checkWebLN();
    
    // Check again after a short delay in case extension loads slowly
    const timer = setTimeout(checkWebLN, 500);
    return () => clearTimeout(timer);
  }, []);

  const enable = async () => {
    if (!webln) return false;
    try {
      await webln.enable();
      setEnabled(true);
      return true;
    } catch (err) {
      console.warn("User rejected WebLN enable request", err);
      return false;
    }
  };

  const sendPayment = async (invoice) => {
    if (!webln || !enabled) {
      const isEnabled = await enable();
      if (!isEnabled) {
        throw new Error("WebLN not enabled");
      }
    }
    
    try {
      const response = await webln.sendPayment(invoice);
      // Expected response format from WebLN spec: { preimage: "..." }
      return response.preimage;
    } catch (err) {
      console.error("WebLN payment failed", err);
      throw err;
    }
  };

  return {
    isAvailable,
    enabled,
    enable,
    sendPayment
  };
}
