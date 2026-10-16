import { appState } from './state.js';
import { openModal, closeModal } from './utils.js';

let currentAltIncidentId = null;

export function validateBenchmarkForm(form) {
  return Boolean(form && form.userId && form.username);
}

export function validateAltAuthorization(alt) {
  return Boolean(alt && alt.incidentId && alt.targetBenchmarkId);
}

export function openAuthorizedAltModal(incidentId) {
  const modal = document.getElementById('modal-tag-alt') || document.getElementById('modal-authorize-alt');
  const incident = appState.incidents.find(i => i.id === incidentId);
  if (!modal || !incident) return;

  currentAltIncidentId = incidentId;
  modal.dataset.incidentId = incidentId;

  const candidateSummary = document.getElementById('alt-candidate-summary');
  const selectBenchmark = document.getElementById('alt-select-benchmark');
  const inputIncidentId = document.getElementById('alt-incident-id');
  const inputJustification = document.getElementById('alt-input-justification') || document.getElementById('alt-justification');
  const inputPurpose = document.getElementById('alt-input-purpose') || document.getElementById('alt-purpose');

  if (inputIncidentId) inputIncidentId.value = incidentId;
  if (inputJustification) inputJustification.value = '';
  if (inputPurpose) inputPurpose.selectedIndex = 0;

  const d = incident.discrepancy || {};
  if (candidateSummary) {
    candidateSummary.replaceChildren();
    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-weight: 700; color: var(--text-primary); font-size: 0.95rem;';
    nameEl.textContent = `@${d.suspect_username || 'Unknown_Suspect'}`;

    const idEl = document.createElement('div');
    idEl.style.cssText = 'font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);';
    idEl.textContent = d.suspect_user_id || 'ID Unknown';

    const flagEl = document.createElement('div');
    flagEl.style.cssText = 'font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;';
    flagEl.append('Flagged against official account: ');
    const strongEl = document.createElement('strong');
    strongEl.textContent = `@${d.matched_benchmark_name || 'Protected Leader'}`;
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

function _handleBenchmarkSave(modalCreateBm) {
  const userIdInput = document.getElementById('bm-input-snowflake') || document.getElementById('bm-input-userid');
  const usernameInput = document.getElementById('bm-input-username');
  const nicknameInput = document.getElementById('bm-input-nickname');
  const roleSelect = document.getElementById('bm-input-role') || document.getElementById('bm-select-role');
  const avatarInput = document.getElementById('bm-input-avatar');
  const tagsInput = document.getElementById('bm-input-tags');

  const userId = userIdInput?.value.trim();
  const username = usernameInput?.value.trim();
  const nickname = nicknameInput?.value.trim() || null;
  const role = roleSelect?.value || 'Community Steward';
  const avatarUrl = avatarInput?.value.trim() || undefined;
  const rawTags = tagsInput?.value.trim();
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : undefined;

  if (!validateBenchmarkForm({ userId, username, role })) {
    alert('User ID and Username are required.');
    return;
  }

  try {
    appState.addBenchmark({
      user_id: userId,
      canonical_username: username,
      server_nickname: nickname,
      community_role: role,
      avatar_url: avatarUrl,
      tags
    });

    if (userIdInput) userIdInput.value = '';
    if (usernameInput) usernameInput.value = '';
    if (nicknameInput) nicknameInput.value = '';
    if (avatarInput) avatarInput.value = '';
    if (tagsInput) tagsInput.value = '';

    const formCreateBm = document.getElementById('form-create-benchmark');
    if (formCreateBm && typeof formCreateBm.reset === 'function') {
      formCreateBm.reset();
    }
    closeModal(modalCreateBm);
  } catch (err) {
    alert(err.message || 'Failed to enroll benchmark');
  }
}

async function _handleAltConfirm(modalAuthorizeAlt) {
  const incidentId = currentAltIncidentId ||
    modalAuthorizeAlt?.dataset?.incidentId ||
    document.getElementById('alt-incident-id')?.value;
  const targetBmId = document.getElementById('alt-select-benchmark')?.value;
  const purposeInput = document.getElementById('alt-input-purpose') || document.getElementById('alt-purpose');
  const justificationInput = document.getElementById('alt-input-justification') || document.getElementById('alt-justification');

  const purpose = purposeInput?.value || 'Secondary Mobile Phone Account';
  const justification = justificationInput?.value?.trim() || '';

  if (!validateAltAuthorization({ incidentId, targetBenchmarkId: targetBmId })) {
    alert('Incident ID and Target Benchmark are required.');
    return;
  }

  try {
    await appState.authorizeAlternate(incidentId, targetBmId, purpose, justification);
    currentAltIncidentId = null;
    closeModal(modalAuthorizeAlt);
  } catch (err) {
    alert(err.message || 'Failed to authorize alternate account');
  }
}

export function initModals() {
  const modalCreateBm = document.getElementById('modal-create-benchmark');
  const btnOpenCreateBm = document.getElementById('btn-add-benchmark') || document.getElementById('btn-open-create-bm');
  const btnSaveBm = document.getElementById('btn-save-benchmark');
  const formCreateBm = document.getElementById('form-create-benchmark');

  const modalAuthorizeAlt = document.getElementById('modal-tag-alt') || document.getElementById('modal-authorize-alt');
  const btnConfirmAlt = document.getElementById('btn-confirm-alt');
  const formAuthorizeAlt = document.getElementById('form-authorize-alt');

  btnOpenCreateBm?.addEventListener('click', () => openModal(modalCreateBm));

  // Benchmark modal close buttons
  document.getElementById('btn-close-bm-modal')?.addEventListener('click', () => closeModal(modalCreateBm));
  document.getElementById('btn-cancel-benchmark')?.addEventListener('click', () => closeModal(modalCreateBm));

  // Benchmark modal save triggers
  btnSaveBm?.addEventListener('click', () => _handleBenchmarkSave(modalCreateBm));
  formCreateBm?.addEventListener('submit', e => {
    e.preventDefault();
    _handleBenchmarkSave(modalCreateBm);
  });

  // Alt modal close buttons
  document.getElementById('btn-close-alt-modal')?.addEventListener('click', () => closeModal(modalAuthorizeAlt));
  document.getElementById('btn-cancel-alt')?.addEventListener('click', () => closeModal(modalAuthorizeAlt));

  // Alt modal confirm triggers
  btnConfirmAlt?.addEventListener('click', () => _handleAltConfirm(modalAuthorizeAlt));
  formAuthorizeAlt?.addEventListener('submit', async e => {
    e.preventDefault();
    await _handleAltConfirm(modalAuthorizeAlt);
  });

  // Generic data-close-modal buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay, .modal-backdrop');
      closeModal(modal);
    });
  });

  // Click outside to dismiss modal overlay
  document.querySelectorAll('.modal-overlay, .modal-backdrop').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });
}

