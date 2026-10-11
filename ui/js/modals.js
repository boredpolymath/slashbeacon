import { appState } from './state.js';
import { openModal, closeModal, escapeHtml } from './utils.js';
import { DOMPurify } from './dompurify.js';

export function openAuthorizedAltModal(incidentId) {
  const modal = document.getElementById('modal-authorize-alt');
  const incident = appState.incidents.find(i => i.id === incidentId);
  if (!modal || !incident) return;

  const candidateSummary = document.getElementById('alt-candidate-summary');
  const selectBenchmark = document.getElementById('alt-select-benchmark');
  const inputIncidentId = document.getElementById('alt-incident-id');
  const inputJustification = document.getElementById('alt-justification');

  if (inputIncidentId) inputIncidentId.value = incidentId;
  if (inputJustification) inputJustification.value = '';

  const d = incident.discrepancy;
  if (candidateSummary) {
    candidateSummary.replaceChildren();
    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-weight: 700; color: var(--text-primary); font-size: 0.95rem;';
    nameEl.textContent = `@${d.suspect_username}`;

    const idEl = document.createElement('div');
    idEl.style.cssText = 'font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);';
    idEl.textContent = d.suspect_user_id;

    const flagEl = document.createElement('div');
    flagEl.style.cssText = 'font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;';
    flagEl.append('Flagged against official account: ');
    const strongEl = document.createElement('strong');
    strongEl.textContent = `@${d.matched_benchmark_name}`;
    flagEl.appendChild(strongEl);

    candidateSummary.append(nameEl, idEl, flagEl);
  }

  if (selectBenchmark) {
    selectBenchmark.replaceChildren();
    appState.benchmarks.forEach(bm => {
      const opt = document.createElement('option');
      opt.value = bm.id;
      opt.textContent = `${bm.canonical_username} (${bm.community_role})`;
      if (bm.id === d.matched_benchmark_id) {
        opt.selected = true;
      }
      selectBenchmark.appendChild(opt);
    });
  }

  openModal(modal);
}

export function initModals() {
  const modalCreateBm = document.getElementById('modal-create-benchmark');
  const btnOpenCreateBm = document.getElementById('btn-open-create-bm');
  const formCreateBm = document.getElementById('form-create-benchmark');
  const formAuthorizeAlt = document.getElementById('form-authorize-alt');
  const modalAuthorizeAlt = document.getElementById('modal-authorize-alt');

  btnOpenCreateBm?.addEventListener('click', () => openModal(modalCreateBm));

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      closeModal(modal);
    });
  });

  formCreateBm?.addEventListener('submit', async e => {
    e.preventDefault();
    const userIdInput = document.getElementById('bm-input-userid');
    const usernameInput = document.getElementById('bm-input-username');
    const nicknameInput = document.getElementById('bm-input-nickname');
    const roleSelect = document.getElementById('bm-select-role');

    const userId = userIdInput?.value.trim();
    const username = usernameInput?.value.trim();
    const nickname = nicknameInput?.value.trim() || null;
    const role = roleSelect?.value || 'Community Steward';

    if (!userId || !username) {
      alert('User ID and Username are required.');
      return;
    }

    try {
      appState.addBenchmark({
        user_id: userId,
        canonical_username: username,
        server_nickname: nickname,
        community_role: role
      });
      formCreateBm.reset();
      closeModal(modalCreateBm);
    } catch (err) {
      alert(err.message || 'Failed to enroll benchmark');
    }
  });

  formAuthorizeAlt?.addEventListener('submit', async e => {
    e.preventDefault();
    const incidentId = document.getElementById('alt-incident-id')?.value;
    const targetBmId = document.getElementById('alt-select-benchmark')?.value;
    const purpose = document.getElementById('alt-purpose')?.value;
    const justification = document.getElementById('alt-justification')?.value;

    if (!incidentId || !targetBmId) return;

    try {
      await appState.authorizeAlternate(incidentId, targetBmId, purpose, justification);
      closeModal(modalAuthorizeAlt);
    } catch (err) {
      alert(err.message || 'Failed to authorize alternate account');
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });
}
