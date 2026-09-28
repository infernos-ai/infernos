import { useState, useRef } from 'react';

export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  
  // This will store the budget info from the latest response headers
  const [budgetInfo, setBudgetInfo] = useState(null);

  const submitStream = async (model, newMessages, macaroon, preimage) => {
    setIsStreaming(true);
    setError(null);
    
    // Add the user message immediately, and an empty assistant message to stream into
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    
    try {
      const authHeader = `L402 ${macaroon}:${preimage}`;
      
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          model,
          messages: newMessages,
          stream: true
        })
      });

      if (res.status === 402) {
        throw new Error("L402 Payment Required. Session budget may be exhausted.");
      }

      if (!res.ok) {
        throw new Error(`Chat completion failed: ${res.statusText}`);
      }

      // Extract budget headers
      const chargedSats = res.headers.get("X-Infernos-Charged-Sats");
      const remainingSats = res.headers.get("X-Infernos-Remaining-Budget-Sats");
      if (chargedSats || remainingSats) {
        setBudgetInfo({
          charged: chargedSats ? parseInt(chargedSats, 10) : undefined,
          remaining: remainingSats ? parseInt(remainingSats, 10) : undefined
        });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      
      let currentAssistantMessage = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line === 'data: [DONE]') {
              done = true;
              break;
            }
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                currentAssistantMessage += content;
                
                // Update the last message (the assistant one)
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = currentAssistantMessage;
                  return updated;
                });
              } catch (e) {
                console.error("Error parsing stream chunk", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    messages,
    isStreaming,
    error,
    budgetInfo,
    submitStream,
    setMessages // Expose in case we want to clear or manually manipulate
  };
}
