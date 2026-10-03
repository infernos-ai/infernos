import { useState, useEffect } from "react";
import { SatsAmount } from "@/components/infernos/sats-amount";
import { StatusBadge } from "@/components/infernos/status-badge";
import { NodeStatus } from "@/components/infernos/node-status";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Activity, ChevronDown, ChevronRight, Key, Cpu } from "lucide-react";
import { SessionStatus, SessionData } from "@/types/session";
import { fetchNodeHealth } from "@/lib/api/node";

interface ProtocolPanelProps {
  sessionStatus: SessionStatus;
  sessionData: SessionData;
  onStartSession: () => void;
}

export function ProtocolPanel({ sessionStatus, sessionData, onStartSession }: ProtocolPanelProps) {
  const [l402Expanded, setL402Expanded] = useState(false);
  const [isNodeOnline, setIsNodeOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        await fetchNodeHealth();
        if (isMounted) setIsNodeOnline(true);
      } catch (e) {
        if (isMounted) setIsNodeOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border/40 flex items-center px-4 bg-card/50 sticky top-0 z-10">
        <h2 className="font-semibold text-sm">Protocol Activity</h2>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Node Status */}
        <NodeStatus isOnline={isNodeOnline ?? true} address="127.0.0.1:8080" />

        {/* Session Card */}
        <Card className="p-4 flex flex-col gap-4 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">Active Session</h3>
            </div>
            {sessionStatus === "active" ? (
              <StatusBadge variant="success">Ready</StatusBadge>
            ) : sessionStatus === "payment_required" ? (
              <StatusBadge variant="warning">402 Pending</StatusBadge>
            ) : sessionStatus === "creating" ? (
              <StatusBadge variant="default">Creating...</StatusBadge>
            ) : sessionStatus === "error" ? (
              <StatusBadge variant="error">Error</StatusBadge>
            ) : (
              <StatusBadge variant="default">Idle</StatusBadge>
            )}
          </div>
          
          {sessionStatus === "idle" || sessionStatus === "creating" || sessionStatus === "error" ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {sessionStatus === "error" ? "Connection failed. Make sure the Rust node is running." : "No active session. Create a session to begin inference."}
              </p>
              <div className="flex justify-between items-end pb-2">
                <SatsAmount amount={sessionData.budget_sats} label="Budget" />
              </div>
              <Button 
                onClick={onStartSession} 
                className="w-full" 
                disabled={sessionStatus === "creating"}
                variant={sessionStatus === "error" ? "destructive" : "default"}
              >
                {sessionStatus === "creating" ? "Creating..." : sessionStatus === "error" ? "Retry" : "Create Session"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">ID</span>
                <span className="font-mono text-xs text-foreground truncate" title={sessionData.id}>{sessionData.id || "sess_..."}</span>
              </div>

              {/* Budget Meter */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-end">
                  <SatsAmount amount={sessionData.remaining_sats ?? sessionData.budget_sats} label="Remaining" />
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">/ {sessionData.budget_sats} sats</span>
                  </div>
                </div>
                <Progress value={((sessionData.remaining_sats ?? sessionData.budget_sats) / sessionData.budget_sats) * 100} className="h-2" />
              </div>
            </div>
          )}
        </Card>

        {(sessionStatus === "payment_required" || sessionStatus === "active") && (
          <>
            {/* L402 Challenge Inspector (Collapsible) */}
            <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
              <button 
                onClick={() => setL402Expanded(!l402Expanded)}
                className="flex items-center justify-between p-3 bg-card hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-lightning" />
                  <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">L402 Challenge</h3>
                </div>
                {l402Expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              
              {l402Expanded && (
                <div className="p-3 pt-0 border-t border-border/50 bg-background/50 flex flex-col gap-3 font-mono text-[10px]">
                  <div className="flex flex-col gap-1 mt-3">
                    <span className="text-muted-foreground uppercase">HTTP Status</span>
                    <span className="text-warning">402 Payment Required</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground uppercase">Invoice</span>
                    <span className="text-foreground break-all">{sessionData.invoice || "Awaiting request..."}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground uppercase">Macaroon</span>
                    <span className="text-foreground break-all max-h-24 overflow-y-auto">{sessionData.macaroon || "Awaiting request..."}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Capability / Auth Log */}
            <div className="flex flex-col gap-3 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Authorization</h3>
              
              <div className={`flex flex-col gap-2`}>
                <div className={`flex items-center gap-3 text-sm ${sessionStatus === 'active' ? '' : 'opacity-50'}`}>
                  <ShieldCheck className={`w-4 h-4 ${sessionStatus === 'active' ? 'text-success' : ''}`} />
                  <span className="text-muted-foreground">Payment proof {sessionStatus === 'active' ? 'verified' : 'pending'}</span>
                </div>
                {sessionStatus === 'active' && (
                  <div className="pl-7 pr-2">
                    <div className="flex flex-col p-2 bg-background border border-border/50 rounded-md">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Preimage (Proof of Payment)</span>
                      <span className="font-mono text-[10px] text-success break-all">{sessionData.preimage}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-3 text-sm ${sessionStatus === 'active' ? '' : 'opacity-50'}`}>
                <Key className={`w-4 h-4 ${sessionStatus === 'active' ? 'text-success' : ''}`} />
                <span className="text-muted-foreground">Macaroon signature {sessionStatus === 'active' ? 'valid' : 'pending'}</span>
              </div>
              <div className={`flex items-center gap-3 text-sm ${sessionStatus === 'active' ? '' : 'opacity-50'}`}>
                <Cpu className={`w-4 h-4 ${sessionStatus === 'active' ? 'text-success' : ''}`} />
                <span className="text-muted-foreground font-mono text-xs">Capability: {sessionData.capability || "inference"}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


