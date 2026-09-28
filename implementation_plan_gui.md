Current backend vs GUI architecture
Capability	Current state	GUI consequence
GET /v1/models	✅ Dynamic upstream discovery	Use directly
POST /v1/session/new	✅ L402 session challenge	Implement real payment flow
POST /v1/chat/completions	✅ Direct + session L402	Implement client
SSE streaming	✅	Implement useChatStream
Dynamic pricing	✅	Frontend must read backend pricing
/v1/node/stats	❌ Not present	Needs backend work
/v1/node/config	❌ Not present	Needs backend work
WebLN	❌ GUI work	Implement
Invoice QR fallback	❌ GUI work	Implement
Operator dashboard	❌ GUI work	Implement

The routes confirm that the daemon currently exposes only /health, /v1/models, /v1/session/new, /v1/chat/completions, and the mock payment endpoint.

So we are not going to start by building the Operator dashboard. We have a dependency there: its telemetry/config APIs don't exist yet.

The good news: the Caller GUI can start now

We already have everything necessary for the first real GUI integration.

The backend currently gives us:

GET /v1/models
POST /v1/session/new
POST /v1/chat/completions

And the L402 flow is already implemented.

For example, /v1/session/new creates the invoice, session, budget, capability caveat, macaroon, and returns the L402 challenge as 402 Payment Required.

The chat endpoint similarly returns an L402 challenge when authorization is absent.

And once authorized, the backend already returns:

X-Infernos-Charged-Sats
X-Infernos-Remaining-Budget-Sats

which means our GUI can display real budget state without implementing its own pricing calculation.

That's exactly the architecture we wanted.

One correction to our earlier plan

We do not need to implement /v1/node/config right now just to start the Caller GUI.

Dynamic pricing already exists in the Rust engine. The GUI doesn't need to modify pricing to consume inference.

Likewise, we don't need /v1/node/stats for the Playground.

Therefore:

                GUI IMPLEMENTATION
                       │
          ┌────────────┴────────────┐
          │                         │
       CLIENT                    OPERATOR
          │                         │
          ▼                         ▼
       START NOW              WAIT FOR STATS API

This lets us keep moving.

New implementation sequence

I would now freeze this sequence:

Phase C1 — Caller API Client

Create the client-side API abstraction.

gui/client/src/api/
├── l402Client.js
└── modelsClient.js

Responsibilities:

modelsClient
GET /v1/models
l402Client
POST /v1/session/new
POST /v1/chat/completions
parse 402
extract invoice
extract macaroon
construct L402 authorization

No payment validation in JavaScript.

The GUI only transports the payment proof to Rust.

Phase C2 — Wallet layer

Then:

gui/client/src/
├── hooks/
│   └── useWebLN.js
└── components/
    ├── WalletBadge.jsx
    └── InvoiceModal.jsx

Flow:

                    402
                     │
                     ▼
              Is WebLN available?
                /          \
              yes           no
               │             │
               ▼             ▼
          WebLN payment   InvoiceModal
               │             │
               └──────┬──────┘
                      ▼
                  preimage
                      │
                      ▼
               L402 Authorization

For development, we can keep the existing mock payment mechanism strictly behind a development/test path. Your Rust endpoint already refuses /internal/mock/pay unless the configured Lightning backend is mock.

Phase C3 — Session state

This is where our existing Playground gets connected.

Current:

sess_placeholder...
100 sats

becomes:

POST /v1/session/new
        ↓
402 challenge
        ↓
pay
        ↓
preimage
        ↓
real session authorization
        ↓
active session

The frontend state should be roughly:

IDLE
  ↓
CREATING_SESSION
  ↓
PAYMENT_REQUIRED
  ↓
PAYING
  ↓
AUTHORIZED
  ↓
ACTIVE

With error branches:

             ┌── PAYMENT_FAILED
             │
AUTHORIZED ──┤
             │
             └── SESSION_ERROR
Phase C4 — Real Playground

Then your current UI becomes connected to reality:

                 PLAYGROUND

 ┌──────────────────────────────────────────────┐
 │ Model: llama3.2        ● Session Active     │
 ├───────────────────────────────┬──────────────┤
 │                               │              │
 │       ChatWindow              │ Protocol     │
 │                               │              │
 │ User                          │ Session      │
 │ Explain Lightning...          │ Budget       │
 │                               │ Payment      │
 │ Model response...             │ Auth         │
 │                               │              │
 ├───────────────────────────────┴──────────────┤
 │ Prompt                                       │
 └──────────────────────────────────────────────┘

But now:

model → backend
session → backend
budget → backend
payment → wallet
authorization → backend
response → backend

No fake protocol state.

Phase C5 — Streaming

Your Rust backend already supports:

stream=true

and emits text/event-stream.

So implement:

gui/client/src/hooks/useChatStream.js

Conceptually:

POST /v1/chat/completions
        ↓
SSE stream
        ↓
useChatStream
        ↓
ChatWindow
        ↓
incremental tokens

This will make the Playground feel like a real inference client.

Then Operator GUI

Only after the Caller path is working do we add:

gui/operator/

But before that, we need a small backend API addition:

GET /v1/node/stats
GET /v1/node/config
POST /v1/node/config

And we need to derive those values from actual Rust state.

We should not invent:

total_sats_earned
channel_count
local_balance
remote_balance

until the Lightning backend actually exposes them.

The architecture document gives the desired response shape, but the current source does not yet provide those APIs, so we shouldn't silently fabricate them.

What about our existing web/?

Keep it.

Your current state is:

?? web/
?? implementation_plan_ui.md

That is actually useful right now.

We have two options:

Option A — migrate immediately

Move the existing Next.js UI into the new Vite structure.

Option B — use it as the visual reference

Build gui/client using the architecture document, then migrate the polished UI components from web/.

I recommend B.

Why?

Because the architecture document explicitly defines:

gui/operator
gui/client
React + Vite

and the current web/ is:

Next.js

We shouldn't create an awkward hybrid architecture just because the first UI prototype is already there.

Your existing UI becomes our design reference and component source, while gui/client becomes the actual architectural implementation.

One thing I want to do before creating gui/client

We need to inspect the exact package/setup of your existing web/ so we can preserve the design system rather than recreate it.

Run:

cd ~/Desktop/Ucee/BossBattle/nodus

printf '\n========== WEB FILES ==========\n'
find web -maxdepth 4 -type f -print | sort

Then:

printf '\n========== PACKAGE ==========\n'
cat web/package.json

Then:

printf '\n========== PLAYGROUND ==========\n'
sed -n '1,360p' web/src/app/playground/page.tsx 2>/dev/null || \
sed -n '1,360p' web/app/playground/page.tsx 2>/dev/null

And:

printf '\n========== COMPONENTS ==========\n'
find web -type f \( -name '*.tsx' -o -name '*.ts' \) -print | sort
Then we'll make the first actual implementation commit

Not backend changes.

Not another mock.

We'll create:

gui/
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── api/
        │   ├── l402Client.js
        │   └── modelsClient.js
        ├── components/
        │   ├── ChatWindow.jsx
        │   ├── WalletBadge.jsx
        │   ├── BudgetMeter.jsx
        │   └── InvoiceModal.jsx
        ├── hooks/
        │   ├── useWebLN.js
        │   └── useChatStream.js
        ├── App.jsx
        ├── index.css
        └── main.jsx

And the first milestone will be deliberately small:

gui/client can call the real /v1/models endpoint and display the models returned by the Rust daemon.

Then:

Models
   ↓
Session
   ↓
402
   ↓
Payment
   ↓
Authorization
   ↓
Streaming inference

That's the cleanest path from the architecture document to the working product.
