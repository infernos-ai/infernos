use crate::cli::process::ProcessManager;
use crate::config::schema::NodeConfig;
use crate::node::server::InfernosServer;
use clap::{Args, Subcommand};
use reqwest::Client;
use std::process;
use std::time::Duration;

#[derive(Args, Debug)]
pub struct NodeArgs {
    #[command(subcommand)]
    pub command: NodeCommands,
}

#[derive(Subcommand, Debug)]
pub enum NodeCommands {
    /// Start the Infernos node
    Start {
        #[arg(short, long, default_value = "config/node.toml")]
        config: String,
    },
    /// Stop the Infernos node
    Stop,
    /// Show the status of the Infernos node
    Status,
}

pub async fn handle_node_command(args: NodeArgs) {
    match args.command {
        NodeCommands::Start { config } => start(config).await,
        NodeCommands::Stop => stop().await,
        NodeCommands::Status => status().await,
    }
}

async fn start(config_path: String) {
    println!("Starting Infernos node...");

    // Check if already running
    if let Some(pid) = ProcessManager::read_pid() {
        if ProcessManager::is_process_alive(pid) {
            eprintln!("Error: Node is already running with PID {}", pid);
            return;
        } else {
            // Clean up stale PID
            ProcessManager::remove_pid();
        }
    }

    let config = match NodeConfig::from_file(&config_path) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            return;
        }
    };
    println!("✓ Configuration loaded from {}", config_path);
    println!("✓ Lightning backend: mock"); // MVP assumption
    println!("✓ Upstream: {}", config.upstream.url);
    println!(
        "✓ Server listening on {}:{}",
        config.server.host, config.server.port
    );

    let server = InfernosServer::new(config);

    // Write PID (the actual binary PID)
    let pid = process::id();
    if let Err(e) = ProcessManager::write_pid(pid) {
        eprintln!("Error writing PID file: {}", e);
        return;
    }

    println!("\nInfernos node is running.");

    // Create signal listener for graceful shutdown
    let shutdown_signal = async {
        let ctrl_c = async {
            let _ = tokio::signal::ctrl_c().await;
        };

        #[cfg(unix)]
        let terminate = async {
            if let Ok(mut sigterm) =
                tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            {
                sigterm.recv().await;
            } else {
                std::future::pending::<()>().await;
            }
        };

        #[cfg(not(unix))]
        let terminate = std::future::pending::<()>();

        tokio::select! {
            _ = ctrl_c => {}
            _ = terminate => {}
        }
        println!("\nShutting down...");
    };

    if let Err(e) = server.run_until_shutdown(shutdown_signal).await {
        eprintln!("Server error: {}", e);
    }

    ProcessManager::remove_pid();
}

async fn status() {
    println!("Infernos Node\n─────────────");

    let pid_opt = ProcessManager::read_pid();
    if pid_opt.is_none() {
        println!("Status:       STOPPED");
        return;
    }

    let pid = pid_opt.unwrap();
    if !ProcessManager::is_process_alive(pid) {
        ProcessManager::remove_pid();
        println!("Status:       STOPPED");
        return;
    }

    let config =
        NodeConfig::from_file("config/node.toml").unwrap_or_else(|_| NodeConfig::default());

    // Check health endpoint
    let client = Client::new();
    let url = format!(
        "http://{}:{}/health",
        config.server.host, config.server.port
    );
    let health_check =
        matches!(client.get(&url).send().await, Ok(res) if res.status().is_success());

    if health_check {
        println!("Status:       RUNNING\n");
    } else {
        println!("Status:       UNHEALTHY\n");
    }

    println!("PID:          {}", pid);
    println!(
        "Endpoint:     {}:{}",
        config.server.host, config.server.port
    );
    println!("Upstream:     {}", config.upstream.url);
    println!(
        "Price:        {} sats/request",
        config.pricing.default_price_sats.0
    );
    println!("Lightning:    MOCK");
}

async fn stop() {
    println!("Stopping Infernos node...");

    let pid_opt = ProcessManager::read_pid();
    if pid_opt.is_none() {
        println!("Infernos node is not running.");
        return;
    }

    let pid = pid_opt.unwrap();
    if !ProcessManager::is_process_alive(pid) {
        ProcessManager::remove_pid();
        println!("Infernos node is not running.");
        return;
    }

    match ProcessManager::stop_process(pid) {
        Ok(true) => {
            println!("✓ Shutdown signal sent");

            // Wait briefly
            for _ in 0..10 {
                if !ProcessManager::is_process_alive(pid) {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(100)).await;
            }

            if ProcessManager::is_process_alive(pid) {
                println!("Node is taking too long to stop. It may need manual intervention.");
            } else {
                ProcessManager::remove_pid();
                println!("✓ Node stopped");
                println!("✓ PID file removed");
            }
        }
        _ => {
            eprintln!("Failed to send shutdown signal.");
        }
    }
}
