import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "./model-selector";
import { Send, Bot, User, Lock, Zap } from "lucide-react";
import { StatusBadge } from "@/components/infernos/status-badge";
import { SessionStatus, SessionData } from "@/types/session";
import { SatsAmount } from "@/components/infernos/sats-amount";
import { Message } from "@/types/inference";
import { useState, KeyboardEvent } from "react";

interface ChatPanelProps {
  sessionStatus: SessionStatus;
  sessionData: SessionData;
  messages: Message[];
  isStreaming: boolean;
  onPayInvoice: () => void;
  onSendMessage: (content: string) => void;
}

export function ChatPanel({ sessionStatus, sessionData, messages, isStreaming, onPayInvoice, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const isInputDisabled = sessionStatus === "idle" || sessionStatus === "creating" || sessionStatus === "payment_required" || sessionStatus === "authorizing" || sessionStatus === "error" || isStreaming;

  const handleSend = () => {
    if (!input.trim() || isInputDisabled) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Chat Header */}
      <div className="h-14 border-b border-border/40 flex items-center px-4 justify-between bg-background/95 z-10">
        <h2 className="font-semibold text-sm">AI Playground</h2>
        <ModelSelector />
      </div>

      {/* Status Bar */}
      {sessionStatus === "active" && (
        <div className="flex items-center justify-center gap-4 py-2 border-b border-border/30 bg-card/50 text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success" /> Session Active</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-lightning">⚡ {sessionData.budget_sats} SATS</span>
          <span className="text-border">|</span>
          <span>Model {sessionData.model || "llama3.2"}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {sessionStatus === "idle" || sessionStatus === "creating" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <Bot className="w-12 h-12 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">Infernos Ready</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Create a session in the Protocol Activity panel to begin permissionless inference.</p>
            </div>
          </div>
        ) : sessionStatus === "error" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-destructive font-bold text-xl">!</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-destructive">Connection Error</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Failed to connect to the Infernos node. Is the Rust backend running?</p>
            </div>
          </div>
        ) : sessionStatus === "payment_required" || sessionStatus === "authorizing" ? (
          <div className="flex items-start gap-4 max-w-3xl mx-auto w-full">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              sessionData.invoice && !String(sessionData.invoice).includes("mock")
                ? "bg-lightning/20"
                : "bg-muted"
            }`}>
              {sessionData.invoice && !String(sessionData.invoice).includes("mock") ? (
                <Zap className="w-4 h-4 text-lightning" />
              ) : (
                <div className="w-3 h-3 border-2 border-muted-foreground rotate-45" />
              )}
            </div>
            <div className="flex flex-col gap-3 mt-1 w-full max-w-md">
              <span className="font-medium text-sm">Payment Required</span>
              
              {sessionData.invoice && !String(sessionData.invoice).includes("mock") ? (
                /* Real Mode UI */
                <div className="rounded-xl border-2 border-lightning bg-card p-5 shadow-[0_0_15px_rgba(245,166,35,0.1)]">
                  <div className="flex items-center gap-2 mb-4 text-lightning font-bold tracking-wider">
                    <Zap className="w-4 h-4" fill="currentColor" />
                    REAL LIGHTNING
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Session</span>
                    <SatsAmount amount={sessionData.budget_sats} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Model</span>
                    <span className="text-sm font-medium">{sessionData.model || "llama3.2"}</span>
                  </div>

                  <div className="flex flex-col gap-2 mb-6">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Lightning Invoice</span>
                    <div className="p-3 bg-background border border-border rounded-lg text-xs font-mono text-muted-foreground break-all max-h-24 overflow-y-auto">
                      {sessionData.invoice}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-lightning text-lightning-foreground hover:bg-lightning/90 font-bold"
                    onClick={onPayInvoice}
                    disabled={sessionStatus === "authorizing"}
                  >
                    {sessionStatus === "authorizing" ? "Authorizing..." : `Pay & Run`}
                  </Button>
                </div>
              ) : (
                /* Testnet/Mock Mode UI */
                <div className="rounded-xl border-2 border-muted bg-card p-5 shadow-sm border-dashed">
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground font-bold tracking-wider">
                    <div className="w-3 h-3 border-2 border-currentColor rotate-45" />
                    LOCAL TESTNET
                  </div>
                  
                  <div className="mb-6 text-sm text-muted-foreground">
                    Mock Lightning Environment
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Session</span>
                    <span className="text-sm font-medium">{sessionData.budget_sats} mock sats</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Model</span>
                    <span className="text-sm font-medium">{sessionData.model || "llama3.2"}</span>
                  </div>

                  <Button 
                    className="w-full bg-muted text-muted-foreground hover:bg-muted/80 font-bold border border-border"
                    onClick={onPayInvoice}
                    disabled={sessionStatus === "authorizing"}
                  >
                    {sessionStatus === "authorizing" ? "Simulating..." : `Pay & Run`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex items-start gap-4 max-w-3xl mx-auto w-full">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="font-medium text-sm">Infernos</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Session established. My capability is currently bounded to {sessionData.budget_sats} sats. How can I help you?
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-4 max-w-3xl mx-auto w-full ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-muted" : "bg-primary/20"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4 text-muted-foreground" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>
                <div className={`flex flex-col gap-1 mt-1 ${msg.role === "user" ? "items-end" : ""}`}>
                  <span className="font-medium text-sm">{msg.role === "user" ? "You" : "Infernos"}</span>
                  <div className={`leading-relaxed ${msg.role === "user" ? "bg-muted px-4 py-2 rounded-2xl rounded-tr-sm" : "text-foreground whitespace-pre-wrap"}`}>
                    {msg.content}
                    {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border/40">
        <div className="max-w-3xl mx-auto relative rounded-xl border border-border bg-card shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <Textarea 
            placeholder={isInputDisabled ? "Awaiting active session..." : "Send a message..."}
            disabled={isInputDisabled}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] w-full resize-none border-0 bg-transparent py-4 pl-4 pr-14 focus-visible:ring-0 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            className="absolute right-3 bottom-3 h-8 w-8 rounded-md"
            disabled={isInputDisabled || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Privacy Indicator */}
        <div className="flex flex-col items-center justify-center mt-3 gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span className="font-medium">Privacy by default</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            No account · No API key · Prompts are not logged
          </p>
        </div>
      </div>
    </div>
  );
}

