# ==============================================================================
# Infernos Node - Multi-Stage Dockerfile
# ==============================================================================

# Build stage
FROM rust:1.85-slim-bookworm AS builder

WORKDIR /usr/src/infernos

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifest and locks to cache dependencies
COPY Cargo.toml Cargo.lock ./

# Create dummy source to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && echo "" > src/lib.rs
RUN cargo build --release || true

# Copy actual source code
COPY src ./src

# Rebuild the application with real source code
RUN touch src/main.rs src/lib.rs && cargo build --release --bin infernos

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged user
RUN useradd -m -u 1000 -U -s /bin/sh infernos

# Setup directories
RUN mkdir -p /etc/infernos /var/lib/infernos && \
    chown -R infernos:infernos /etc/infernos /var/lib/infernos

# Copy compiled binary from builder
COPY --from=builder /usr/src/infernos/target/release/infernos /usr/local/bin/infernos

USER infernos
WORKDIR /var/lib/infernos

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/infernos"]
CMD ["node", "start", "--config", "/etc/infernos/node.toml"]
