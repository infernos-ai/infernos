"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConnectButton = dynamic(
  () => import("@getalby/bitcoin-connect-react").then((mod) => mod.Button),
  { ssr: false }
);

export function Navbar() {
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

        <div className="flex items-center gap-4">
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
