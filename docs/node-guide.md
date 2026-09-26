# Infernos Node Operator Guide

This guide walks operators through turning a machine with local open-weight models into a self-sovereign inference endpoint that earns Satoshis over the Lightning Network.

---

## 1. Hardware & System Prerequisites

Infernos is lightweight (~15MB compiled binary) and connects to any OpenAI-compatible inference engine running locally.

### Recommended System Specifications
- **Operating System**: Linux (Ubuntu 22.04+ recommended), macOS, or Windows (WSL2 / native).
- **RAM / VRAM Requirements**:
  - Small models (`llama3.2:1b`, `llama3.2:3b`, `qwen2.5:3b`): 4GB – 8GB VRAM or 16GB system RAM.
  - Mid models (`llama3.1:8b`, `mistral:7b`): 8GB – 16GB VRAM (NVIDIA RTX 3060/4060 or Apple Silicon M-series).
  - Large models (`command-r`, `llama3.3:70b`): Multi-GPU or high-memory unified systems.
- **Inference Runtime**: [Ollama](https://ollama.ai) (recommended for ease of use) or [vLLM](https://github.com/vllm-project/vllm).

---

## 2. Quick Setup with Ollama

### Step 1: Install and Launch Ollama
```bash
# Install Ollama (Linux/macOS)
curl -fsSL https://ollama.com/install.sh | sh

# Pull desired models
ollama pull llama3.2
ollama pull mistral
```
By default, Ollama listens on `http://127.0.0.1:11434`.

---

## 3. Configuring the Infernos Node

Copy the example configuration file:
```bash
cp config/node.example.toml config/node.toml
```

### Configuration Reference (`config/node.toml`)

```toml
[server]
# Host address to bind the Infernos L402 Gate
host = "0.0.0.0"
# Port for the public API
port = 8080

[upstream]
# Address of the local inference engine
url = "http://127.0.0.1:11434"

[pricing]
# Default base price per request in Satoshis
default_price_sats = 10

# Optional fine-grained per-token pricing (in satoshis)
# sats_per_prompt_token = 0
# sats_per_completion_token = 0

[lightning]
# Lightning backend: "mock" (testing), "lnd", or "nwc"
backend = "mock"

# For LND:
# lnd_rpc_host = "localhost:10009"
# lnd_macaroon_path = "~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"
# lnd_tls_cert_path = "~/.lnd/tls.cert"

# For Nostr Wallet Connect (NWC):
# nwc_uri = "nostr+walletconnect://..."
```

---

## 4. Operating the Node Lifecycle

The Infernos CLI provides full process lifecycle controls:

### Start the Node
```bash
cargo run -- node start --config config/node.toml

# Or using the built release binary:
./target/release/infernos node start --config config/node.toml
```

Output:
```text
Starting Infernos node...
✓ Configuration loaded from config/node.toml
✓ Lightning backend: mock
✓ Upstream: http://127.0.0.1:11434
✓ Server listening on 0.0.0.0:8080

Infernos node is running.
```

### Check Node Status & Health
```bash
cargo run -- node status
```

Output:
```text
Infernos Node
─────────────
Status:       RUNNING
PID:          42891
Endpoint:     0.0.0.0:8080
Upstream:     http://127.0.0.1:11434
Price:        10 sats/request
Lightning:    MOCK
```

### Stop the Node
Gracefully shut down the running node:
```bash
cargo run -- node stop
```

---

## 5. Running with Docker Compose

To run both the Infernos Node and an Ollama container in a single command:
```bash
docker compose -f docker/docker-compose.yml up -d
```

To pull a model into the containerized Ollama instance:
```bash
docker exec -it infernos-ollama ollama pull llama3.2
```
Your node is now accessible on port `8080`!
