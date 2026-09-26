use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub struct ProcessManager;

impl ProcessManager {
    fn pid_file_path() -> PathBuf {
        let dir = Path::new(".infernos");
        if !dir.exists() {
            let _ = fs::create_dir_all(dir);
        }
        dir.join("node.pid")
    }

    pub fn write_pid(pid: u32) -> std::io::Result<()> {
        fs::write(Self::pid_file_path(), pid.to_string())
    }

    pub fn read_pid() -> Option<u32> {
        let content = fs::read_to_string(Self::pid_file_path()).ok()?;
        content.trim().parse::<u32>().ok()
    }

    pub fn remove_pid() {
        let _ = fs::remove_file(Self::pid_file_path());
    }

    pub fn is_process_alive(pid: u32) -> bool {
        // Send signal 0 to check if process exists (Unix specific, works on Linux/macOS)
        if let Ok(status) = Command::new("kill").arg("-0").arg(pid.to_string()).status() {
            status.success()
        } else {
            false
        }
    }

    pub fn stop_process(pid: u32) -> std::io::Result<bool> {
        let status = Command::new("kill")
            .arg("-15") // SIGTERM
            .arg(pid.to_string())
            .status()?;
        Ok(status.success())
    }
}
