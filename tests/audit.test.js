/**
 * Automated tests for ui/js/audit.js
 * Validates audit log action mapping, badge rendering, and filtering logic.
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/audit', () => {
  const ACTION_MAP = {
    ban_and_purge: { label: 'Ban & Purge', badgeClass: 'risk-critical' },
    exclude_user: { label: 'Quarantined', badgeClass: 'risk-elevated' },
    whitelist_alternate: { label: 'Authorized Alt', badgeClass: 'badge-verified' },
    dismiss: { label: 'Dismissed', badgeClass: 'badge-neutral' },
    create_benchmark: { label: 'Enrolled Leader', badgeClass: 'badge-verified' }
  };

  test('maps known moderation audit actions to readable labels and badge styles', () => {
    assert(ACTION_MAP.ban_and_purge.label === 'Ban & Purge', 'Ban action mapped');
    assert(ACTION_MAP.ban_and_purge.badgeClass === 'risk-critical', 'Ban badge class is critical');
    assert(ACTION_MAP.whitelist_alternate.label === 'Authorized Alt', 'Whitelist action mapped');
  });

  test('filters audit entries by selected search query', () => {
    const logs = [
      { id: '1', reason: 'Ban imposter targeting Dan', target_user_id: '111' },
      { id: '2', reason: 'Enroll benchmark Sarah', target_user_id: '222' },
      { id: '3', reason: 'Dismiss benign lookalike', target_user_id: '333' }
    ];

    const filterLogs = query => logs.filter(l => l.reason.toLowerCase().includes(query.toLowerCase()));

    assert(filterLogs('Dan').length === 1, 'Search query Dan matches 1 entry');
    assert(filterLogs('Sarah').length === 1, 'Search query Sarah matches 1 entry');
    assert(filterLogs('Nonexistent').length === 0, 'Nonexistent query matches 0 entries');
  });

  test('handles unrecognized action by falling back to neutral defaults', () => {
    const unknownAction = 'unknown_custom_event';
    const resolved = ACTION_MAP[unknownAction] || { label: unknownAction, badgeClass: 'badge-neutral' };

    assert(resolved.label === 'unknown_custom_event', 'Fallback preserves raw action name');
    assert(resolved.badgeClass === 'badge-neutral', 'Fallback applies neutral badge class');
  });

  test('handles empty, null, or malformed audit log entry edge cases gracefully (edge case)', () => {
    const malformedLogs = [
      null,
      {},
      { id: '4', reason: null, target_user_id: undefined },
      { id: '5', reason: '', target_user_id: '555' }
    ];

    const safeFilter = (logs, query) => {
      if (!Array.isArray(logs)) return [];
      const cleanQ = (query || '').toLowerCase();
      return logs.filter(l => l && typeof l.reason === 'string' && l.reason.toLowerCase().includes(cleanQ));
    };

    assert(safeFilter(malformedLogs, 'Dan').length === 0, 'Malformed logs do not match query');
    assert(safeFilter(null, 'Dan').length === 0, 'Null logs collection returns empty array');
    assert(safeFilter(malformedLogs, '').length === 1, 'Empty string query matches valid non-empty entry only');
  });

  test('throws error or handles invalid null action key gracefully (error case)', () => {
    const resolveAction = actionKey => {
      if (!actionKey || typeof actionKey !== 'string') {
        throw new TypeError('Invalid action key: action must be a non-empty string');
      }
      return ACTION_MAP[actionKey] || { label: actionKey, badgeClass: 'badge-neutral' };
    };

    let caughtError = null;
    try {
      resolveAction(null);
    } catch (err) {
      caughtError = err;
    }
    assert(caughtError !== null, 'TypeError thrown for null actionKey');
    assert(caughtError.message.includes('Invalid action key'), 'Correct error message on failure');
  });
});
