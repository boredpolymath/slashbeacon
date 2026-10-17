pub mod circuit_breaker;
pub mod commands;
pub mod credentials;
pub mod detection;
pub mod diagnostics;
pub mod gateway;
pub mod models;
pub mod storage;
pub mod vault;

use commands::*;

pub mod notification;
pub mod tray;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Initialize local SQLite storage and run startup integrity verification (Phase 11.3 & 25.3)
            let storage = match storage::StorageManager::default_instance() {
                Ok(s) => s,
                Err(e) => {
                    log::error!(
                        "CRITICAL: Failed to initialize local SQLite storage: {}. Halting startup to prevent unsafe operations.",
                        e
                    );
                    return Err(Box::<dyn std::error::Error>::from(e.to_string()));
                }
            };

            match storage.verify_integrity() {
                Ok(storage::DatabaseIntegrityStatus::Healthy) => {
                    log::info!("Local SQLite database integrity verified (PRAGMA integrity_check == ok)");
                }
                Ok(storage::DatabaseIntegrityStatus::Corrupted { errors, quarantine_backup_path }) => {
                    log::error!(
                        "CRITICAL: Local SQLite database corruption detected! Errors: {:?}. Quarantined copy preserved at {:?}",
                        errors,
                        quarantine_backup_path
                    );
                    return Err(Box::<dyn std::error::Error>::from(format!(
                        "Database integrity failure ({:?}); original evidence preserved at {:?}",
                        errors, quarantine_backup_path
                    )));
                }
                Ok(storage::DatabaseIntegrityStatus::CheckFailed { error }) => {
                    log::warn!(
                        "Transient failure attempting database integrity verification: {}",
                        error
                    );
                }
                Err(e) => {
                    log::error!("Database integrity check query execution error: {}", e);
                }
            }

            // Register persistent system tray icon on startup (Phase 17.1)
            tray::setup_system_tray(app)?;

            #[cfg(debug_assertions)]
            {
                if let Ok(incidents) = storage.list_incidents(None, None) {
                    if incidents.is_empty() {
                        let _ = seed_dev_fixtures(&storage);
                    }
                }
            }

            // Launch Discord Gateway connections for all registered, authorized guild credentials (Phase 14.5)
            tauri::async_runtime::spawn(async move {
                gateway::daemon::start_all_registered_daemons().await;
            });

            // Spawn background auto-updater check 5 seconds after startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                use tauri::Emitter;
                use tauri_plugin_updater::UpdaterExt;
                if let Ok(updater) = app_handle.updater() {
                    if let Ok(Some(update)) = updater.check().await {
                        log::info!("SlashBeacon update available: v{}", update.version);
                        let update_payload = serde_json::json!({
                            "version": update.version,
                            "body": update.body,
                            "date": update.date.map(|d| d.to_string()),
                        });
                        let _ = app_handle.emit("slashbeacon://update-available", &update_payload);
                        let _ = app_handle.emit("truthbeacon://update-available", &update_payload);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Keep app persistent in system tray when user closes main window
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_system_status,
            get_health_diagnostics,
            list_benchmarks,
            get_benchmark,
            create_benchmark,
            update_benchmark,
            delete_benchmark,
            list_incidents,
            resolve_incident,
            reset_circuit_breaker,
            get_circuit_breaker_status,
            run_sandbox_simulation,
            eradicate_local_data,
            verify_bot_handshake,
            import_benchmarks_from_role,
            import_benchmark_by_snowflake,
            promote_incident_to_benchmark,
            get_taxonomy_tags,
            synchronize_benchmark_avatars,
            list_audit_logs,
            dispatch_desktop_notification,
            execute_notification_action,
            get_discord_config,
            save_discord_config,
            disconnect_discord,
            fetch_bot_guilds,
            check_for_updates,
            install_update
        ])
        .build(tauri::generate_context!())
        .expect("error while running SlashBeacon application")
        .run(|_app_handle, event| {
            if matches!(event, tauri::RunEvent::Exit | tauri::RunEvent::ExitRequested { .. }) {
                diagnostics::graceful_shutdown();
            }
        });
}

#[cfg(debug_assertions)]
fn seed_dev_fixtures(storage: &storage::StorageManager) -> rusqlite::Result<()> {
    use rusqlite::params;
    let conn_arc = storage.get_connection();
    let conn = conn_arc.lock().unwrap();

    let bm_count: i64 = conn.query_row("SELECT count(*) FROM benchmarks;", [], |r| r.get(0))?;
    if bm_count == 0 {
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "INSERT INTO benchmarks (id, guild_id, user_id, canonical_username, server_nickname, community_role, avatar_url, avatar_perceptual_hash, is_active, tags, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9, ?10, ?11);",
            params![
                "bm_alex_admin",
                "guild_production_9921",
                "291039401928374829",
                "AlexRivera",
                "Alex Rivera (Owner)",
                "Server Owner / Lead Administrator",
                "assets/avatars/pastor_dan.svg",
                "a8f3b4c9e1d2f071",
                "[\"Core Staff\",\"Server Owner\",\"Verified VIP\"]",
                now - 86400,
                now - 86400
            ],
        )?;

        conn.execute(
            "INSERT INTO benchmarks (id, guild_id, user_id, canonical_username, server_nickname, community_role, avatar_url, avatar_perceptual_hash, is_active, tags, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9, ?10, ?11);",
            params![
                "bm_sarah_mod",
                "guild_production_9921",
                "192830491820491820",
                "SarahChen",
                "Sarah | Community Care",
                "Lead Moderator & Community Manager",
                "assets/avatars/sarah_mod.svg",
                "3c89f1a702b8d4e9",
                "[\"Moderation Team\",\"Direct Message Escrow\"]",
                now - 86400,
                now - 86400
            ],
        )?;

        conn.execute(
            "INSERT INTO benchmarks (id, guild_id, user_id, canonical_username, server_nickname, community_role, avatar_url, avatar_perceptual_hash, is_active, tags, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9, ?10, ?11);",
            params![
                "bm_support_bot",
                "guild_production_9921",
                "991827364510293847",
                "CommunityHelpDesk",
                "Official Support Desk",
                "Verified System Service",
                "assets/avatars/support_bot.svg",
                "ff00cc3399aa5511",
                "[\"Official Service\",\"Automated Desk\"]",
                now - 86400,
                now - 86400
            ],
        )?;
    }

    let inc_count: i64 = conn.query_row("SELECT count(*) FROM incidents;", [], |r| r.get(0))?;
    if inc_count == 0 {
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "INSERT INTO incidents (id, guild_id, timestamp, suspect_user_id, suspect_username, suspect_nickname, suspect_avatar_url, suspect_account_age_hours, matched_benchmark_id, matched_benchmark_name, string_similarity_score, homoglyph_detected, normalized_diff, avatar_hamming_distance, risk_tier, status, resolution_notes, operator_id, resolved_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 'pending', NULL, NULL, NULL);",
            params![
                "inc_901",
                "guild_production_9921",
                now - 840,
                "128492019482710492",
                "Alex\u{0420}ivera",
                "Alex Rivera (Owner)",
                "assets/avatars/pastor_dan_alt.svg",
                2,
                "bm_alex_admin",
                "AlexRivera",
                0.98,
                1,
                "Cyrillic Er (Р) substituted for Latin R; identical server nickname",
                1,
                "critical"
            ],
        )?;

        conn.execute(
            "INSERT INTO incidents (id, guild_id, timestamp, suspect_user_id, suspect_username, suspect_nickname, suspect_avatar_url, suspect_account_age_hours, matched_benchmark_id, matched_benchmark_name, string_similarity_score, homoglyph_detected, normalized_diff, avatar_hamming_distance, risk_tier, status, resolution_notes, operator_id, resolved_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 'pending', NULL, NULL, NULL);",
            params![
                "inc_902",
                "guild_production_9921",
                now - 3120,
                "128492019482799999",
                "CommunityHelpDesk_",
                "Official Support Desk [VERIFIED]",
                "assets/avatars/support_bot.svg",
                18,
                "bm_support_bot",
                "CommunityHelpDesk",
                0.94,
                0,
                "Trailing underscore suffix; matching avatar perceptual hash",
                0,
                "notable"
            ],
        )?;

        conn.execute(
            "INSERT INTO incidents (id, guild_id, timestamp, suspect_user_id, suspect_username, suspect_nickname, suspect_avatar_url, suspect_account_age_hours, matched_benchmark_id, matched_benchmark_name, string_similarity_score, homoglyph_detected, normalized_diff, avatar_hamming_distance, risk_tier, status, resolution_notes, operator_id, resolved_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 'pending', NULL, NULL, NULL);",
            params![
                "inc_904",
                "guild_production_9921",
                now - 14400,
                "128492019482755555",
                "SarahChen.",
                "Sarah Chen",
                "assets/avatars/sarah_mod.svg",
                54,
                "bm_sarah_mod",
                "SarahChen",
                0.89,
                0,
                "Trailing period character; identical profile picture hash",
                0,
                "standard"
            ],
        )?;
    }

    // Seed dev Discord credentials for guild_production_9921 so developer console displays fully active bot state
    let demo_token =
        "MTE5ODI3MzY0NTEyOTM4NDc1.Gk3_4A.mock_dev_bot_token_valid_signature_hash_9921_safe";
    let _ = crate::credentials::CredentialManager::store_token("guild_production_9921", demo_token);

    Ok(())
}
