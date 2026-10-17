### Overview
SlashBeacon v0.5.0 (Post-Mortem Release) delivers key operational and lifecycle features learned from real-world testing. Leading this milestone is granular, one-by-one member removal directly from the Protected Members vault with an inline safety confirmation flow, ensuring clean server departures without risk of accidental dismissals. Furthermore, v0.5.0 resolves IPC disconnect modal handling when unlinking Discord servers, sanitizes and isolates dev-mode mock data fixtures from release bundles, and upgrades the complete public screenshot carousel and visual identity to reflect the live, hardened state of SlashBeacon.

---

### What's New & Hardened in v0.5.0

#### 1. Granular Protected Member Removal
- **Individual Member Deletion**: Added an intuitive, accessible **Remove** button to each protected member profile card in the Protected Members vault (`#pane-vault`).
- **Inline Safety Confirmation**: Two-stage interactive confirmation (`"Remove"` -> `"Confirm?"`) with automatic 3.5-second reset and outside-click/Escape cancellation, preventing accidental removal while bypassing modal freezes on macOS WKWebView.
- **Immediate State & Ledger Synchronization**: Invokes the native Tauri `delete_benchmark` command, purges the record from SQLite, automatically updates the live counter badge (`counter-vault`), renders the clean empty state if the vault is emptied, and logs an immutable `delete_benchmark` audit trail record.

#### 2. Disconnect & Gateway Resilience
- **Safe Server Disconnection**: Fixed Discord disconnection flow by handling gateway state transitions gracefully without modal freezes or uncaught exceptions.
- **Production Asset Isolation**: Ensured sample / mock fixture data is strictly confined to local development testing, guaranteeing release builds launch with clean-slate zero-data defaults.

#### 3. Visual Identity & Showcase Asset Refresh
- **Updated Hero Banner (`logo.png`)**: Modernized root and documentation hero banner featuring the radiant SlashBeacon crystalline emblem and official branding.
- **Live Interface Screenshots & Animated Carousel**: Re-rendered all 5 showcase screenshots (`screenshot_protected.png`, `screenshot_alerts.png`, `screenshot_activity_log.png`, `screenshot_discord_setup.png`, `screenshot_setup_guide.png`) and the animated `app_carousel.webp` in native macOS dark-mode window chrome reflecting current v0.5.0 UI controls.

#### 4. Cryptographic Provenance & Test Gates
- **215/215 Passing Tests**: Full test suite pass across Rust backend modules, IPC handlers, and frontend components.
- **Manifests & Signatures**: Synchronized checksums and OpenPGP/minisign signatures across `release/latest.json`, `release/SHA256SUMS.txt`, and `release/RELEASE_MANIFEST.md`.
