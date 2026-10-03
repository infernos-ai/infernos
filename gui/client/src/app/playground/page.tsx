"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { ChatPanel } from "@/components/playground/chat-panel";
import { ProtocolPanel } from "@/components/playground/protocol-panel";
import { SessionStatus, SessionData } from "@/types/session";
import { createSession } from "@/lib/api/sessions";
import { L402Error } from "@/types/api";
import { streamChatCompletion } from "@/lib/api/inference";
import { Message } from "@/types/inference";
// Use dynamic import inside the handler for requestProvider to avoid SSR errors
// import { requestProvider } from '@getalby/bitcoin-connect';
export default function PlaygroundPage() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [sessionData, setSessionData] = useState<SessionData>({ budget_sats: 10000 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStartSession = async () => {
    try {
      setSessionStatus("creating");
      await createSession(sessionData.budget_sats);
    } catch (e) {
      if (e instanceof L402Error) {
        setSessionStatus("payment_required");
        setSessionData((prev) => ({
          ...prev,
          invoice: e.challenge.invoice,
          macaroon: e.challenge.macaroon,
          id: e.challenge.parsedCaveats?.session,
          capability: e.challenge.parsedCaveats?.capability,
          budget_sats: parseInt(e.challenge.parsedCaveats?.budget || "100", 10),
          remaining_sats: parseInt(e.challenge.parsedCaveats?.budget || "100", 10),
        }));
      } else {
        setSessionStatus("error");
      }
    }
  };

  const handlePayInvoice = async () => {
    setSessionStatus("authorizing");
    try {
      const invoiceStr = sessionData.invoice as string;
      const { requestProvider } = await import('@getalby/bitcoin-connect');
      const webln = await requestProvider();
      const paymentResponse = await webln.sendPayment(invoiceStr);
      setSessionData((prev) => ({
        ...prev,
        preimage: paymentResponse.preimage
      }));
      setSessionStatus("active");
    } catch (err: any) {
      console.error("WebLN Payment failed:", err);
      setSessionStatus("payment_required");
    }
  };

  const handlePayWithNwc = async (nwcUri: string) => {
    setSessionStatus("authorizing");
    try {
      const invoiceStr = sessionData.invoice as string;
      const { connectNWC, requestProvider } = await import('@getalby/bitcoin-connect');
      connectNWC(nwcUri);
      const webln = await requestProvider();
      const paymentResponse = await webln.sendPayment(invoiceStr);
      setSessionData((prev) => ({
        ...prev,
        preimage: paymentResponse.preimage
      }));
      setSessionStatus("active");
    } catch (err: any) {
      console.error("NWC Payment failed:", err);
      setSessionStatus("payment_required");
      throw err;
    }
  };

  const handleManualPreimage = (preimage: string) => {
    setSessionData((prev) => ({
      ...prev,
      preimage
    }));
    setSessionStatus("active");
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    
    const newUserMessage: Message = { role: "user", content };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setIsStreaming(true);

    try {
      // Add a placeholder assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      await streamChatCompletion(
        {
          model: sessionData.model || "llama3.2",
          messages: newMessages,
        },
        sessionData.macaroon || "",
        sessionData.preimage || "",
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + chunk };
            }
            return updated;
          });
        },
        (sats) => {
          setSessionData((prev) => ({
            ...prev,
            remaining_sats: Math.max(0, (prev.remaining_sats || prev.budget_sats || 0) - sats)
          }));
        }
      );
    } catch (e) {
      console.error("Inference Error:", e);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: last.content + "\n\n**[Connection to Infernos node failed or was unauthorized.]**" };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Chat Area */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-border/40">
          <ChatPanel 
            sessionStatus={sessionStatus} 
            sessionData={sessionData}
            messages={messages}
            isStreaming={isStreaming}
            onPayInvoice={handlePayInvoice}
            onPayWithNwc={handlePayWithNwc}
            onManualPreimage={handleManualPreimage}
            onSendMessage={handleSendMessage}
          />
        </section>

        {/* Right Pane: Protocol Activity */}
        <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col bg-card/30 overflow-y-auto">
          <ProtocolPanel 
            sessionStatus={sessionStatus} 
            sessionData={sessionData}
            onStartSession={handleStartSession} 
          />
        </aside>
      </main>
    </div>
  );
}



