"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/infernos/status-badge";
import { SatsAmount } from "@/components/infernos/sats-amount";
import { Progress } from "@/components/ui/progress";
import { Activity, Key, Clock, Database, ArrowRight, Trash2, PlusCircle } from "lucide-react";
import { getStoredSessions, deleteStoredSession, StoredSession } from "@/lib/storage/sessions";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSessions(getStoredSessions());
    setIsLoaded(true);
  }, []);

  const handleDelete = (id: string) => {
    deleteStoredSession(id);
    setSessions(getStoredSessions());
  };

  const totalCapability = sessions.reduce((acc, s) => acc + (s.budget_sats || 0), 0);
  const totalSpent = sessions.reduce(
    (acc, s) => acc + Math.max(0, (s.budget_sats || 0) - (s.remaining_sats ?? s.budget_sats ?? 0)),
    0
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 p-6 md:p-12 max-w-6xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">My Sessions</h1>
            <p className="text-muted-foreground">
              Manage your real L402 capabilities, session budgets, and authorization proofs.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                Total Capability
              </span>
              <span className="font-semibold text-lightning">{totalCapability} SATS</span>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                Total Spent
              </span>
              <span className="font-semibold text-foreground">{totalSpent} SATS</span>
            </div>
          </div>
        </div>

        {isLoaded && sessions.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center gap-4 border border-dashed border-border bg-card/30">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Key className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">No Active Sessions</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                You haven't opened any inference sessions yet. Launch a session in the Playground to
                interact with models and track real sat expenditures.
              </p>
            </div>
            <Link href="/playground">
              <Button className="mt-2 font-medium flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Open Playground
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`p-6 border ${
                  session.status === "active"
                    ? "border-primary/30 bg-card shadow-sm"
                    : "border-border/50 bg-background/50 opacity-80"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
                  {/* Identity & Status */}
                  <div className="flex items-start gap-4 lg:w-1/3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        session.status === "active"
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Key className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold truncate max-w-[180px]" title={session.id}>
                          {session.id}
                        </span>
                        {session.status === "active" && <StatusBadge variant="success">Active</StatusBadge>}
                        {session.status === "exhausted" && (
                          <StatusBadge variant="warning">Exhausted</StatusBadge>
                        )}
                        {session.status === "expired" && <StatusBadge variant="error">Expired</StatusBadge>}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {formatDate(session.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Scope & Capability */}
                  <div className="flex flex-col gap-1 lg:w-1/4">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Scope
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{session.model}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                      <span className="font-mono text-xs text-muted-foreground">{session.capability}</span>
                    </div>
                  </div>

                  {/* Budget Tracker */}
                  <div className="flex flex-col gap-2 lg:w-1/3">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          Remaining
                        </span>
                        <SatsAmount amount={session.remaining_sats} />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        / {session.budget_sats} sats
                      </span>
                    </div>
                    <Progress
                      value={
                        session.budget_sats > 0
                          ? (session.remaining_sats / session.budget_sats) * 100
                          : 0
                      }
                      className={`h-2 ${
                        session.status === "active"
                          ? "[&>div]:bg-success"
                          : "[&>div]:bg-muted-foreground"
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {session.requests_count || 0} requests
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="text-muted-foreground hover:text-destructive text-xs transition-colors p-1"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
