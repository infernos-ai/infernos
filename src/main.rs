use clap::Parser;
use infernos::cli::{Cli, Commands};
use infernos::common::error::Result;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();
    match cli.command {
        Commands::Node(args) => match args.action {
            infernos::cli::node::NodeAction::Start {
                config: config_path,
            } => {
                tracing::info!("Loading config from {}", config_path);
                let node_config = infernos::config::schema::NodeConfig::from_file(&config_path)?;
                let server = infernos::node::server::InfernosServer::new(node_config);
                tracing::info!("Starting InfernosServer::run()");
                server.run().await?;
            }
            infernos::cli::node::NodeAction::Status => {
                tracing::info!("Node status not implemented yet");
            }
            infernos::cli::node::NodeAction::Stop => {
                tracing::info!("Node stop not implemented yet");
            }
        },
        Commands::Call(args) => {
            tracing::info!("Call command not fully implemented yet.");
            tracing::info!("Executing call command for model: {}", args.model);
        }
    }

    Ok(())
}
