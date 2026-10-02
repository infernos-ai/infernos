/**
 * Helper to extract Macaroon and Invoice from a 402 WWW-Authenticate header.
 * Expected format: L402 token="base64...", invoice="lnbc..."
 */
function parseL402Challenge(authHeader) {
  if (!authHeader || !authHeader.startsWith("L402 ")) return null;
  
  const tokenMatch = authHeader.match(/(?:token|macaroon)="([^"]+)"/);
  const invoiceMatch = authHeader.match(/invoice="([^"]+)"/);
  
  if (!tokenMatch || !invoiceMatch) return null;
  
  return {
    macaroon: tokenMatch[1],
    invoice: invoiceMatch[1]
  };
}

/**
 * Creates a new L402 session.
 * Expects a 402 Payment Required response with an L402 challenge.
 */
export async function createSession(budgetSats) {
  const res = await fetch("/v1/session/new", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ budget_sats: budgetSats })
  });

  if (res.status === 402) {
    const challenge = parseL402Challenge(res.headers.get("www-authenticate"));
    if (challenge) {
      return { 
        status: 402, 
        challenge 
      };
    }
  }

  throw new Error(`Expected 402 Payment Required, got ${res.status}`);
}

/**
 * Submits a chat completion request using an L402 authorization header.
 */
export async function submitChatCompletion(model, messages, macaroon, preimage, stream = false) {
  const authHeader = `L402 ${macaroon}:${preimage}`;
  
  const res = await fetch("/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify({
      model,
      messages,
      stream
    })
  });

  if (res.status === 402) {
    // Budget might be exhausted
    const challenge = parseL402Challenge(res.headers.get("www-authenticate"));
    throw { status: 402, challenge, message: "Payment Required" };
  }

  if (!res.ok) {
    throw new Error(`Chat completion failed: ${res.statusText}`);
  }

  // Extract budget state if available (for UI tracking without calculating pricing client-side)
  const chargedSats = res.headers.get("X-Infernos-Charged-Sats");
  const remainingSats = res.headers.get("X-Infernos-Remaining-Budget-Sats");

  return {
    response: res, // Return raw response for streaming or json handling
    budgetInfo: {
      charged: chargedSats ? parseInt(chargedSats, 10) : undefined,
      remaining: remainingSats ? parseInt(remainingSats, 10) : undefined,
    }
  };
}
