"use client";

import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/infernos/status-badge";
import { SatsAmount } from "@/components/infernos/sats-amount";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, Activity, Key, Clock, Database, ArrowRight } from "lucide-react";

// Mock data representing a client's stored macaroons / L402 sessions
const MOCK_SESSIONS = [
  {
    id: "sess_active_9f8e2",
    status: "active",
    model: "llama3.2",
    capability: "inference",
    budget_sats: 100,
    remaining_sats: 84,
    created_at: "10 mins ago",
    requests: 3
  },
  {
    id: "sess_exhausted_1b4c",
    status: "exhausted",
    model: "mistral",
    capability: "inference",
    budget_sats: 50,
    remaining_sats: 0,
    created_at: "2 hours ago",
    requests: 5
  },
  {
    id: "sess_expired_7d9a",
    status: "expired",
    model: "qwen2",
    capability: "inference",
    budget_sats: 500,
    remaining_sats: 450,
    created_at: "2 days ago",
    requests: 1
  }
];

export default function SessionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 p-6 md:p-12 max-w-6xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">My Sessions</h1>
            <p className="text-muted-foreground">Manage your L402 capabilities, budgets, and request history.</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Total Capability</span>
              <span className="font-semibold text-lightning">650 SATS</span>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Total Spent</span>
              <span className="font-semibold text-foreground">116 SATS</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {MOCK_SESSIONS.map((session) => (
            <Card key={session.id} className={`p-6 border ${session.status === 'active' ? 'border-primary/30 bg-card shadow-sm' : 'border-border/50 bg-background/50 opacity-80'}`}>
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
                
                {/* Identity & Status */}
                <div className="flex items-start gap-4 lg:w-1/3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${session.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{session.id}</span>
                      {session.status === 'active' && <StatusBadge variant="success">Active</StatusBadge>}
                      {session.status === 'exhausted' && <StatusBadge variant="warning">Budget Exhausted</StatusBadge>}
                      {session.status === 'expired' && <StatusBadge variant="error">Expired</StatusBadge>}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {session.created_at}
                    </span>
                  </div>
                </div>

                {/* Scope & Capability */}
                <div className="flex flex-col gap-1 lg:w-1/4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Scope</span>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span>{session.model}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    <span className="font-mono text-xs">{session.capability}</span>
                  </div>
                </div>

                {/* Budget Tracker */}
                <div className="flex flex-col gap-2 lg:w-1/3">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Remaining</span>
                      <SatsAmount amount={session.remaining_sats} />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">/ {session.budget_sats}</span>
                  </div>
                  <Progress 
                    value={(session.remaining_sats / session.budget_sats) * 100} 
                    className={`h-2 ${session.status === 'active' ? '[&>div]:bg-success' : '[&>div]:bg-muted-foreground'}`}
                  />
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{session.requests} requests performed</span>
                  </div>
                </div>
                
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
