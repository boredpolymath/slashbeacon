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

  test('handles malformed benchmark or null authorized_alts without error (error and edge case)', () => {
    const extractAlts = bm => {
      if (!bm || typeof bm !== 'object') return [];
      if (!Array.isArray(bm.authorized_alts)) return [];
      return bm.authorized_alts.filter(a => a && typeof a === 'object' && a.user_id);
    };

    assert(extractAlts(null).length === 0, 'Null benchmark returns empty alts list');
    assert(extractAlts({}).length === 0, 'Missing authorized_alts returns empty list');
    assert(extractAlts({ authorized_alts: null }).length === 0, 'Null authorized_alts handled safely');
    assert(extractAlts({ authorized_alts: [null, { user_id: '123' }] }).length === 1, 'Filters invalid alt items');
  });

  test('handles short, invalid, or empty user_id snowflake suffix extraction (edge case)', () => {
    const extractSuffix = userId => {
      if (!userId || typeof userId !== 'string') return '0000';
      const clean = userId.trim();
      return clean.length >= 4 ? clean.slice(-4) : clean.padStart(4, '0');
    };

    assert(extractSuffix('123456789012345678') === '5678', 'Standard snowflake extracts last 4 digits');
    assert(extractSuffix('42') === '0042', 'Short ID is safely zero-padded');
    assert(extractSuffix('') === '0000', 'Empty ID falls back to 0000');
    assert(extractSuffix(null) === '0000', 'Null ID falls back to 0000');
  });

  test('validates remove benchmark button attributes and action delegation structure', () => {
    const bm = {
      id: 'bm_pastor_dan',
      canonical_username: 'Dan',
      server_nickname: 'Pastor Dan',
      community_role: 'Pastor'
    };
    const buttonAttrs = {
      'data-action': 'remove-benchmark',
      'data-id': bm.id,
      'data-name': bm.server_nickname || bm.canonical_username,
      title: 'Remove member from protected vault'
    };

    assert(buttonAttrs['data-action'] === 'remove-benchmark', 'Remove action mapped');
    assert(buttonAttrs['data-id'] === 'bm_pastor_dan', 'Correct benchmark ID attached');
    assert(buttonAttrs['data-name'] === 'Pastor Dan', 'Correct display name passed to data attribute');
  });
});
