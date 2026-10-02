"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConnectButton = dynamic(
  () => import("@getalby/bitcoin-connect-react").then((mod) => mod.Button),
  { ssr: false }
);

export function Navbar() {
  const [network, setNetwork] = useState<"regtest" | "testnet" | "mainnet">("regtest");

  useEffect(() => {
    import("@getalby/bitcoin-connect").then(({ init }) => {
      init({ appName: "Infernos" });
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold tracking-tight text-lg">INFERNOS</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/playground" className="hover:text-foreground transition-colors">Playground</Link>
          <Link href="/sessions" className="hover:text-foreground transition-colors">Sessions</Link>
          <Link href="/node" className="hover:text-foreground transition-colors">Node</Link>
          <Link href="https://github.com/infernos-ai/infernos" target="_blank" className="hover:text-foreground transition-colors">GitHub</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Bitcoin Network Indicator & Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-card text-xs font-mono shadow-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                network === "mainnet"
                  ? "bg-lightning"
                  : network === "testnet"
                  ? "bg-primary"
                  : "bg-success"
              }`}
            />
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as "regtest" | "testnet" | "mainnet")}
              className="bg-transparent text-xs font-mono font-medium focus:outline-none cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <option value="regtest" className="bg-popover text-popover-foreground">
                Regtest (Polar)
              </option>
              <option value="testnet" className="bg-popover text-popover-foreground">
                Testnet / Signet
              </option>
              <option value="mainnet" className="bg-popover text-popover-foreground">
                Bitcoin Mainnet
              </option>
            </select>
          </div>

          <ConnectButton />
          
          <Link href="/playground">
            <Button variant="default" size="sm" className="hidden sm:flex font-medium">
              Open Playground
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
