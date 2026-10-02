# Implementation Plan: Infernos Web Console

**Product Goal**: Make Infernos understandable in under 30 seconds and demonstrate the complete protocol in under 3 minutes.
**Core Experience**: Ask → Pay → Prove → Unlock → Infer

---

## 0. Architecture & Design Direction
- **Identity**: Bitcoin infrastructure + AI infrastructure + terminal-grade engineering. (Dark, technical, premium).
- **Colors**: Background (`#08090B`), Primary Text (`#F5F7FA`), Infernos Accent (`#FF6B2C`), Lightning Accent (`#F7C948`), Success (`#39D98A`).
- **Typography**: Inter (UI readability) and JetBrains Mono (Technical/protocol data).
- **Frontend Stack**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Framer Motion, TanStack Query, Zod.

## 1. File Structure
```text
web/
├── app/
│   ├── page.tsx
│   ├── playground/page.tsx
│   ├── node/page.tsx
│   ├── sessions/page.tsx
│   └── docs/page.tsx
├── components/ (ui, layout, playground, payment, session, node, protocol)
├── lib/ (api, l402, utils, validation)
├── hooks/ (use-session, use-inference, use-node-status, use-payment)
├── types/ (api, session, payment, inference)
└── styles/
```

## 2. Implementation Phases

### Phase UI-0 — Foundation
- Create Next.js app inside `web/` directory.
- Install dependencies: Tailwind, Fonts, ESLint, TypeScript.
- Set up design tokens, global CSS, layout, and theme.
- **Exit**: Empty Infernos shell running.

### Phase UI-1 — Design System
- Build fundamental UI primitives: Button, Card, Badge, Input, Textarea, Dialog, Tabs, Progress, Toast.
- Build specific components: `SatsAmount`, `StatusBadge`, `NodeStatus`.
- **Exit**: Consistent visual language.

### Phase UI-2 — Landing Page
- Build Navbar, Hero ("Open Models. Paid in Sats."), How it works (Request → Pay → Prove → Infer).
- Protocol visualization, Features, CTA, Footer.
- **Exit**: Polished public landing page.

### Phase UI-3 — Playground Shell
- Build Playground layout: Chat area, Prompt input, Model selector, Session panel, Protocol panel.
- No real API integration yet.
- **Exit**: Complete UX skeleton.

### Phase UI-4 — Session Integration
- Connect `POST /v1/session/new`.
- Implement session creation, budget display, session state, and error handling.
- **Exit**: Real sessions visible.

### Phase UI-5 — L402 Integration
- Implement 402 detection, challenge parsing, invoice display.
- Handle payment state and authorization state.
- **Exit**: Request → 402 → Payment UI → Authorization flow.

### Phase UI-6 — Inference Integration
- Connect `/v1/chat/completions`.
- Implement request retries after payment, streaming support, errors, model interaction, and messages.
- **Exit**: Actual AI response streaming in UI.

### Phase UI-7 — Protocol Inspector
- Build collapsible panel to expose 402, Payment, Preimage proof, Capability, Budget, Model, and Session details.
- **Exit**: Judges can inspect the mechanism.

### Phase UI-8 — Node Dashboard
- Implement Node status, Model, Price, Sessions, Requests, and Operator state (using real backend data).
- **Exit**: Operational operator dashboard.

### Phase UI-9 — Sessions Management
- Implement session list, session details, budget tracking, capabilities, expiration, and request history.

### Phase UI-10 — Error & Edge States
- Implement Loading, Empty, Success, Error, Offline, Payment failed, Budget exhausted, Session expired, Model/Node unavailable states.

### Phase UI-11 — Visual Polish
- Refine animations, responsive layouts (Mobile/Tablet/Desktop), typography, spacing, icons, transitions, loading skeletons, and micro-interactions.

### Phase UI-12 — Demo Mode
- A reliable presentation flow: Open Playground → Ask → 402 PAYMENT REQUIRED (10 sats) → PAY → PAYMENT SETTLED → CAPABILITY UNLOCKED → MODEL RESPONDS → 80 SATS REMAINING.

### Phase UI-13 — Docker / Deployment
- Package the Frontend, Infernos Node, Ollama, and Model into a multi-stage Docker setup.

### Phase UI-14 — Final QA
- Test across devices, browsers, and simulate edge cases (network failure, backend failure, payment failure).

---

## 3. Immediate Next Move

Freeze this UI implementation specification. Create the frontend foundation (Phase UI-0) using Next.js without touching the existing Rust backend.
