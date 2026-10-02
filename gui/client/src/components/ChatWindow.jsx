import { useState, useRef, useEffect } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import { BudgetMeter } from './BudgetMeter';

export function ChatWindow({ model, authData, onSessionError }) {
  const { messages, isStreaming, error, budgetInfo, submitStream } = useChatStream();
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);
  
  const [localBudget, setLocalBudget] = useState({ initial: 100, remaining: 100 });

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (budgetInfo?.remaining !== undefined) {
      setLocalBudget(prev => ({ ...prev, remaining: budgetInfo.remaining }));
    }
  }, [budgetInfo]);

  useEffect(() => {
    if (error && error.includes('402')) {
      onSessionError("Budget exhausted. Please create a new session.");
    }
  }, [error, onSessionError]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    submitStream(
      model,
      [...messages, { role: 'user', content: input }],
      authData.macaroon,
      authData.preimage
    );
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/40 bg-card/80 backdrop-blur flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-semibold text-sm text-foreground">{model}</span>
        </div>
        <BudgetMeter budgetSats={localBudget.initial} remainingSats={localBudget.remaining} />
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-muted-foreground text-center my-auto flex flex-col items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
            <p>Session Authorized. Ready to stream inference.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'self-end bg-primary text-primary-foreground rounded-br-sm' 
                : 'self-start bg-muted text-foreground border border-border/40 rounded-bl-sm'
            }`}
          >
            {msg.content || (msg.role === 'assistant' && isStreaming && i === messages.length - 1 ? (
              <span className="animate-pulse">...</span>
            ) : '')}
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSubmit}
        className="p-4 border-t border-border/40 bg-card/80 backdrop-blur flex gap-2"
      >
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isStreaming ? "Streaming..." : "Type your prompt..."}
          disabled={isStreaming}
          className="flex-1 bg-input/50 border border-border focus:border-ring focus:ring-1 focus:ring-ring rounded-lg px-4 py-3 text-foreground outline-none transition-all disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
        >
          Send
        </button>
      </form>
    </div>
  );
}
