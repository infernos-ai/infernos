"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Activity, Cpu, Server, Network, Shield, Settings2, Users } from "lucide-react";
import { StatusBadge } from "@/components/infernos/status-badge";
import { NodeStatus } from "@/components/infernos/node-status";

interface ModelInfo {
  id: string;
  object: string;
  owned_by: string;
}

export default function NodeDashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, modelsRes] = await Promise.all([
          fetch("/health").then(r => r.json()),
          fetch("/v1/models").then(r => r.json())
        ]);
        
        setHealth(healthRes);
        setModels(modelsRes.data || []);
      } catch (e) {
        console.error("Failed to fetch node data", e);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Node Dashboard</h1>
          <p className="text-muted-foreground">Real-time operational metrics for your local Infernos node.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-col gap-2 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Node Status</span>
            </div>
            {isLoading ? (
              <div className="h-8 animate-pulse bg-muted rounded w-1/2"></div>
            ) : health ? (
              <div>
                <StatusBadge variant="success">Online</StatusBadge>
                <div className="text-xs text-muted-foreground mt-2 font-mono">Service: {health.service}</div>
              </div>
            ) : (
              <StatusBadge variant="error">Offline</StatusBadge>
            )}
          </Card>

          <Card className="p-4 flex flex-col gap-2 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Cpu className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Active Models</span>
            </div>
            {isLoading ? (
              <div className="h-8 animate-pulse bg-muted rounded w-1/2"></div>
            ) : (
              <div>
                <span className="text-2xl font-bold">{models.length}</span>
                <div className="text-xs text-muted-foreground mt-1">Available for inference</div>
              </div>
            )}
          </Card>

          <Card className="p-4 flex flex-col gap-2 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Active Sessions</span>
            </div>
            <div>
              <span className="text-2xl font-bold">1</span>
              <div className="text-xs text-muted-foreground mt-1">Mocked for UI-8</div>
            </div>
          </Card>

          <Card className="p-4 flex flex-col gap-2 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Network className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Network</span>
            </div>
            <div>
              <span className="text-2xl font-bold">Lightning</span>
              <div className="text-xs text-muted-foreground mt-1">Mock Backend</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="p-6 bg-card border border-border">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Hosted Models
              </h2>
              
              <div className="flex flex-col gap-4">
                {isLoading ? (
                  <div className="h-16 animate-pulse bg-muted rounded-xl"></div>
                ) : models.length > 0 ? (
                  models.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">{m.id}</span>
                        <span className="text-xs text-muted-foreground">Provider: {m.owned_by}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium text-lightning">10 sats / req</span>
                        <StatusBadge variant="success">Ready</StatusBadge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No models found.</p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-card border border-border">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Node Configuration
              </h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Host</span>
                  <span className="text-sm font-mono text-foreground">127.0.0.1:8080</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Macaroon Key</span>
                  <span className="text-sm font-mono text-success">Generated (in-memory)</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">LND Node Alias</span>
                  <span className="text-sm font-mono text-foreground">infernos-mock</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Max Budget / Session</span>
                  <span className="text-sm font-mono text-foreground">10,000 sats</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
             <Card className="p-6 bg-card border border-border flex flex-col gap-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </h2>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-success" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">L402 Enforced</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All API endpoints require a valid Macaroon and cryptographically verified Lightning payment preimage.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-success" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Caveat Verification</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Macaroons are strictly scoped by capability (inference) and budget bounds.
                  </p>
                </div>
              </div>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
