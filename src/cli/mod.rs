pub mod call;
pub mod discover;
pub mod node;
pub mod process;

use clap::{Parser, Subcommand};

#[derive(Parser, Debug)]
#[command(
    name = "infernos",
    version,
    about = "Permissionless Open-Model Inference Paid in Sats via L402"
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// Operator node commands
    Node(node::NodeArgs),
    /// Caller inference commands
    Call(call::CallArgs),
    /// Discover active Infernos nodes announced on Nostr relays
    Discover(discover::DiscoverArgs),
}
