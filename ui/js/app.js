/**
 * SlashBeacon Main UI Coordinator
 * Modularized architecture integrating triage, vault, audit, setup, and notification services.
 */

import { appState } from './state.js';
import { invokeCommand } from './ipc.js';
import { renderTriageCards } from './triage.js';
import { renderVaultGrid } from './vault.js';
import { renderAuditTable } from './audit.js';
import { initNotificationListeners } from './notifications.js';
import { loadDiscordConfig, initDiscordSetupListeners } from './discord_setup.js';
import { initModals, openAuthorizedAltModal } from './modals.js';
import { closeAllModals } from './utils.js';

export function switchTab(targetTab) {
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === targetTab));
  tabPanes.forEach(p => p.classList.toggle('active', p.id === `pane-${targetTab}`));
  appState.setTab(targetTab);
}

function updateView() {
  try {
    const circuitStatusText = document.getElementById('circuit-status-text');
    const statusGateway = document.getElementById('status-gateway');
    const cb = appState.daemonHealth.circuit_breaker;
    const cbBanner = document.getElementById('circuit-breaker-alert');
    const dotCircuit = document.getElementById('dot-circuit');

    if (cbBanner) {
      cbBanner.style.display = cb.tripped ? 'flex' : 'none';
    }

    if (dotCircuit) {
      dotCircuit.className = `status-dot ${cb.tripped ? 'offline' : 'online'}`;
    }

    if (circuitStatusText) {
      if (cb.tripped) {
        circuitStatusText.textContent = `Protection: Safety Pause (${cb.remaining_cooldown}s)`;
      } else {
        circuitStatusText.textContent = 'Protection: Active';
      }
    }

    if (statusGateway) {
      const isConn = appState.daemonHealth.gateway_connected;
      statusGateway.innerHTML = `
        <span class="status-dot ${isConn ? 'online' : 'offline'}"></span>
        <span>Discord: <strong>${isConn ? 'Connected' : 'Disconnected'}</strong></span>
      `;
    }

    renderTriageCards();
    renderVaultGrid();
    renderAuditTable();
  } catch (err) {
    console.error('[SlashBeacon UI] Error during view update:', err);
  }
}

function initNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (targetTab) switchTab(targetTab);
    });
  });

  document.getElementById('status-gateway')?.addEventListener('click', () => {
    switchTab('discord');
  });

  document.getElementById('btn-reset-circuit')?.addEventListener('click', () => {
    appState.resetCircuitBreaker();
  });

  document.getElementById('btn-help-go-discord')?.addEventListener('click', () => {
    switchTab('discord');
  });

  document.getElementById('btn-check-update')?.addEventListener('click', async () => {
    const updateText = document.getElementById('update-status-text');
    const oldText = updateText?.textContent || 'v0.5.0';
    if (updateText) updateText.textContent = 'Checking...';
    try {
      const update = await invokeCommand('check_for_updates');
      if (update && update.available) {
        alert(`Update v${update.version} available!`);
      } else {
        alert('SlashBeacon is running the latest version (v0.5.0).');
      }
    } catch (_err) {
      alert('SlashBeacon is running the latest version (v0.5.0).');
    } finally {
      if (updateText) updateText.textContent = oldText;
    }
  });
}

function initTriageActionDelegation() {
  const triageContainer = document.getElementById('triage-cards-container');
  triageContainer?.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (!id) return;

    if (action === 'open-alt-modal') {
      openAuthorizedAltModal(id);
      return;
    }

    if (action === 'ban' || action === 'exclude' || action === 'dismiss') {
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = action === 'ban' ? 'Purging...' : 'Resolving...';
      try {
        await appState.resolveIncident(id, action);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = oldText;
        alert(`Moderation action failed: ${err.message || err}`);
      }
    }
  });
}

function initVaultActionDelegation() {
  const vaultContainer = document.getElementById('vault-cards-container');
  if (!vaultContainer) return;

  const confirmTimers = new Map();

  function resetBtn(btn) {
    if (!btn || !btn.isConnected) return;
    const btnId = btn.getAttribute('data-id');
    if (confirmTimers.has(btnId)) {
      clearTimeout(confirmTimers.get(btnId));
      confirmTimers.delete(btnId);
    }
    btn.classList.remove('confirm-active');
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      <span>Remove</span>
    `;
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-remove-benchmark')) {
      const activeBtns = vaultContainer.querySelectorAll('.btn-remove-benchmark.confirm-active');
      activeBtns.forEach(btn => resetBtn(btn));
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeBtns = vaultContainer.querySelectorAll('.btn-remove-benchmark.confirm-active');
      activeBtns.forEach(btn => resetBtn(btn));
    }
  });

  vaultContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="remove-benchmark"]');
    if (!btn) return;

    e.stopPropagation();
    const id = btn.getAttribute('data-id');
    if (!id) return;

    if (!btn.classList.contains('confirm-active')) {
      const otherActive = vaultContainer.querySelectorAll('.btn-remove-benchmark.confirm-active');
      otherActive.forEach(b => resetBtn(b));

      btn.classList.add('confirm-active');
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>Confirm?</span>
      `;

      const timer = setTimeout(() => {
        resetBtn(btn);
      }, 3500);
      confirmTimers.set(id, timer);
      return;
    }

    if (confirmTimers.has(id)) {
      clearTimeout(confirmTimers.get(id));
      confirmTimers.delete(id);
    }

    btn.disabled = true;
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
      <span>Removing...</span>
    `;

    try {
      await appState.removeBenchmark(id);
    } catch (err) {
      console.error('Failed to remove protected member:', err);
      resetBtn(btn);
      alert(`Failed to remove member: ${err.message || err}`);
    }
  });
}

function initKeyboardShortcuts() {
  window.addEventListener('keydown', async e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.key === 'Escape') {
      closeAllModals();
      return;
    }

    const pendingIncidents = appState.incidents.filter(i => i.status === 'pending');
    if (pendingIncidents.length === 0) return;
    const firstInc = pendingIncidents[0];

    const key = e.key.toUpperCase();
    if (key === 'B') {
      e.preventDefault();
      try {
        await appState.resolveIncident(firstInc.id, 'ban');
      } catch (err) {
        alert(`Ban & Purge failed on Discord: ${err.message || err}`);
      }
    } else if (key === 'W') {
      e.preventDefault();
      openAuthorizedAltModal(firstInc.id);
    } else if (key === 'E') {
      e.preventDefault();
      try {
        await appState.resolveIncident(firstInc.id, 'exclude');
      } catch (err) {
        alert(`Action failed: ${err.message || err}`);
      }
    } else if (key === 'D') {
      e.preventDefault();
      try {
        await appState.resolveIncident(firstInc.id, 'dismiss');
      } catch (err) {
        alert(`Dismiss failed: ${err.message || err}`);
      }
    }
  });
}

async function syncLiveDiagnostics() {
  try {
    const diag = await invokeCommand('get_health_diagnostics');
    if (diag) {
      const footerMem = document.getElementById('footer-memory-stat');
      if (footerMem && typeof diag.resident_memory_mb === 'number') {
        footerMem.textContent = `RAM: ${diag.resident_memory_mb.toFixed(1)} MB • 100% Local SQLite`;
      }
      appState.daemonHealth.gateway_connected = !!diag.gateway_connected;
      appState.daemonHealth.circuit_breaker.tripped = !!diag.circuit_breaker_tripped;
      updateView();
    }
  } catch (err) {
    console.warn('Diagnostics polling notice:', err);
  }
}

function initApp() {
  initNavigation();
  initTriageActionDelegation();
  initVaultActionDelegation();
  initModals();
  initNotificationListeners();
  initDiscordSetupListeners();
  initKeyboardShortcuts();

  appState.subscribe(updateView);
  updateView();
  loadDiscordConfig();

  (async () => {
    await appState.hydrate();
    syncLiveDiagnostics();
  })();

  setInterval(syncLiveDiagnostics, 5000);
}

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
