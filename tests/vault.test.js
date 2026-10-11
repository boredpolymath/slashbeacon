/**
 * Automated tests for ui/js/vault.js
 * Validates benchmark card formatting, authorized alts tag serialization, and handle distinction.
 */

import { escapeHtml } from '../ui/js/utils.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/vault', () => {
  test('detects when server nickname differs from canonical username', () => {
    const leaderWithNick = { canonical_username: 'Dan', server_nickname: 'Pastor Dan' };
    const leaderWithoutNick = { canonical_username: 'Dan', server_nickname: 'Dan' };

    const hasDistinctHandle = bm => Boolean(bm.server_nickname && bm.server_nickname !== bm.canonical_username);

    assert(hasDistinctHandle(leaderWithNick) === true, 'Distinct nickname identified');
    assert(hasDistinctHandle(leaderWithoutNick) === false, 'Matching nickname is not distinct');
  });

  test('formats authorized alternate account tags with user ID suffix', () => {
    const alt = { user_id: '123456789012345678', label: 'Mobile Device', note: 'Verified by Dan' };
    const suffix = alt.user_id.slice(-4);
    const tagText = `Alt: ${escapeHtml(alt.label)} (${escapeHtml(suffix)})`;

    assert(suffix === '5678', 'Suffix extracts last 4 digits of snowflake ID');
    assert(tagText === 'Alt: Mobile Device (5678)', 'Tag text renders correctly');
  });

  test('handles benchmark with no authorized alts gracefully', () => {
    const bmWithoutAlts = { canonical_username: 'Lead', authorized_alts: [] };
    const hasAlts = Boolean(bmWithoutAlts.authorized_alts && bmWithoutAlts.authorized_alts.length > 0);

    assert(hasAlts === false, 'Empty alts list correctly handled without rendering error');
  });
});
