use clap::Parser;
use infernos::cli::{Cli, Commands};
use infernos::common::error::Result;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();
    match cli.command {
        Commands::Node(args) => {
            infernos::cli::node::handle_node_command(args).await;
        }
        Commands::Call(args) => {
            infernos::cli::call::handle_call_command(args).await;
        }
    }

    Ok(())
}
