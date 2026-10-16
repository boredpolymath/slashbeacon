// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    slashbeacon_lib::diagnostics::init_sanitized_logger();
    slashbeacon_lib::run();
}
