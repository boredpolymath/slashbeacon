import { appState } from './state.js';
import { invokeCommand } from './ipc.js';
import { escapeHtml } from './utils.js';
import { DOMPurify } from './dompurify.js';

const notifiedIncidentIds = new Set();

export function closeToastWithAnimation(toastEl) {
  if (!toastEl) return;
  if (toastEl._dismissTimer) clearTimeout(toastEl._dismissTimer);
  toastEl.classList.add('hiding');
  setTimeout(() => {
    if (toastEl.parentNode) toastEl.remove();
  }, 220);
}

export function inspectIncidentCard(incidentId) {
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  navTabs.forEach(t => t.classList.remove('active'));
  tabPanes.forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="triage"]')?.classList.add('active');
  document.getElementById('pane-triage')?.classList.add('active');
  appState.setTab('triage');

  requestAnimationFrame(() => {
    const card = document.getElementById(`card-${incidentId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('card-inspected-highlight');
      void card.offsetWidth;
      card.classList.add('card-inspected-highlight');
      setTimeout(() => card.classList.remove('card-inspected-highlight'), 3000);
    }
  });
}

export function _extractNotificationData(payload) {
  const incidentId = payload.incident_id || payload.id;
  const rawTier = (payload.risk_tier || payload.discrepancy?.risk_tier || '').toLowerCase();
  const isCritical = rawTier === 'critical';
  const isElevated = rawTier === 'elevated';
  const tierClass = isCritical ? 'risk-critical' : 'risk-elevated';
  const tierBadge = isCritical ? 'Critical' : 'Elevated';
  const suspectName = payload.suspect_username || payload.discrepancy?.suspect_username || 'Unknown_Suspect';
  const suspectId = payload.suspect_user_id || payload.discrepancy?.suspect_user_id || 'user_demo_101';
  const targetName = payload.matched_benchmark_name || payload.discrepancy?.matched_benchmark_name || 'Protected Leader';

  let similarityPct = 95;
  if (payload.similarity_score !== undefined) {
    similarityPct = Math.round(payload.similarity_score * 100);
  } else if (payload.discrepancy?.string_similarity_score !== undefined) {
    similarityPct = Math.round(payload.discrepancy.string_similarity_score * 100);
  }

  const reason = payload.reason || payload.discrepancy?.normalized_diff || 'Lookalike impersonation candidate detected';

  return {
    incidentId,
    isCritical,
    isElevated,
    tierClass,
    tierBadge,
    suspectName,
    suspectId,
    targetName,
    similarityPct,
    reason
  };
}

export function _buildToastHtml(data) {
  const safeSuspect = escapeHtml(data.suspectName);
  const safeTarget = escapeHtml(data.targetName);
  const safeReason = escapeHtml(data.reason);
  const safeIncidentId = escapeHtml(data.incidentId);

  return DOMPurify.sanitize(`
    <div class="toast-header">
      <div class="toast-brand-row">
        <img src="assets/truthbeacon_emblem.png" class="toast-brand-icon" alt="TruthBeacon">
        <span class="toast-brand-title">TruthBeacon Alert</span>
      </div>
      <div class="toast-header-right">
        <span class="toast-risk-badge ${data.isCritical ? 'critical' : 'elevated'}">${escapeHtml(data.tierBadge)}</span>
        <button class="toast-close-btn" data-action="close" title="Dismiss notification" aria-label="Close notification">&times;</button>
      </div>
    </div>
    <div class="toast-body">
      <div class="toast-comparison-strip">
        <span class="toast-suspect-name" title="Suspect Imposter: @${safeSuspect}">@${safeSuspect}</span>
        <span class="toast-vs-tag">VS</span>
        <span class="toast-target-name" title="Official Leader: @${safeTarget}">@${safeTarget}</span>
      </div>
      <div class="toast-meta-line">
        <span class="toast-meta-pill">${data.similarityPct}% Match</span>
        ${safeReason}
      </div>
    </div>
    <div class="toast-actions-row">
      <button class="btn-toast btn-toast-inspect" data-action="inspect" data-incident-id="${safeIncidentId}" title="Inspect in alerts queue">
        Inspect
      </button>
      <button class="btn-toast btn-toast-dismiss" data-action="dismiss" data-incident-id="${safeIncidentId}" title="Dismiss as benign coincidence [D]">
        <kbd>D</kbd> Dismiss
      </button>
      <button class="btn-toast btn-toast-ban" data-action="ban" data-incident-id="${safeIncidentId}" title="Ban imposter from server [B]">
        <kbd>B</kbd> Ban & Purge
      </button>
    </div>
    <div class="toast-progress-track">
      <div class="toast-progress-bar"></div>
    </div>
  `);
}

export function showDesktopNotificationToast(payload, forceShow = false) {
  const toastContainer = document.getElementById('desktop-toast-container');
  if (!toastContainer) return;

  const data = _extractNotificationData(payload);
  if (!forceShow && notifiedIncidentIds.has(data.incidentId)) {
    return;
  }
  if (!data.isCritical && !data.isElevated && !forceShow) {
    return;
  }
  notifiedIncidentIds.add(data.incidentId);

  const existingToast = document.getElementById(`toast-${data.incidentId}`);
  if (existingToast) existingToast.remove();

  const toastEl = document.createElement('div');
  toastEl.className = `desktop-toast ${data.tierClass}`;
  toastEl.id = `toast-${data.incidentId}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = DOMPurify.sanitize(_buildToastHtml(data));
  toastContainer.appendChild(toastEl);

  invokeCommand('dispatch_desktop_notification', {
    payload: {
      incident_id: data.incidentId,
      risk_tier: data.isCritical ? 'Critical' : 'Elevated',
      suspect_username: data.suspectName,
      suspect_user_id: data.suspectId,
      matched_benchmark_name: data.targetName,
      similarity_score: data.similarityPct / 100,
      reason: data.reason,
      actions: ['Inspect', 'Dismiss', 'Ban & Purge']
    }
  }).catch(err => {
    console.warn('Desktop notification dispatch warning:', err);
  });

  toastEl._dismissTimer = setTimeout(() => {
    closeToastWithAnimation(toastEl);
  }, 12000);
}

export function initNotificationListeners() {
  const toastContainer = document.getElementById('desktop-toast-container');
  toastContainer?.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const incidentId = btn.getAttribute('data-incident-id');
    const toastEl = btn.closest('.desktop-toast');

    if (action === 'close') {
      closeToastWithAnimation(toastEl);
    } else if (action === 'inspect') {
      closeToastWithAnimation(toastEl);
      inspectIncidentCard(incidentId);
      invokeCommand('execute_notification_action', {
        incident_id: incidentId,
        action: 'Inspect'
      }).catch(err => {
        console.warn('Execute notification action warning:', err);
      });
    } else if (action === 'dismiss') {
      try {
        await appState.resolveIncident(incidentId, 'dismiss');
        closeToastWithAnimation(toastEl);
      } catch (err) {
        alert(`Dismiss failed: ${err.message || err}`);
      }
    } else if (action === 'ban') {
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = 'Purging...';
      try {
        await appState.resolveIncident(incidentId, 'ban');
        closeToastWithAnimation(toastEl);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = oldText;
        alert(`Ban & Purge failed on Discord: ${err.message || err}`);
      }
    }
  });

  document.getElementById('btn-test-toast')?.addEventListener('click', () => {
    showDesktopNotificationToast({
      incident_id: 'test_toast_' + Date.now(),
      risk_tier: 'critical',
      suspect_username: 'TestImposter',
      suspect_user_id: '128492019482710492',
      matched_benchmark_name: 'AlexRivera',
      similarity_score: 0.98,
      reason: 'Manual notification test'
    }, true);
  });

  if (typeof window !== 'undefined' && window.__TAURI__?.event?.listen) {
    window.__TAURI__.event.listen('truthbeacon://inspect-incident', event => {
      if (event.payload?.incident_id) {
        inspectIncidentCard(event.payload.incident_id);
      }
    });

    window.__TAURI__.event.listen('truthbeacon://native-notification', event => {
      if (event.payload) {
        showDesktopNotificationToast(event.payload);
      }
    });

    window.__TAURI__.event.listen('truthbeacon://incident-resolved', event => {
      if (event.payload?.incident_id) {
        const incId = event.payload.incident_id;
        const action = event.payload.action;
        const inc = appState.incidents.find(i => i.id === incId);
        if (inc && inc.status === 'pending') {
          inc.status = action === 'ban' ? 'banned' : 'dismissed';
          appState.notify();
        }
      }
    });
  }
}
