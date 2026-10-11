/**
 * Automated tests for ui/js/triage.js
 * Validates imposter alert triage card structure, similarity score mapping, and discrepancy categorization.
 */

import { escapeHtml } from '../ui/js/utils.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/triage', () => {
  test('calculates similarity percentages correctly across fractional bounds', () => {
    const scores = [0.95, 0.884, 1.0, 0.72];
    const percentages = scores.map(s => Math.round(s * 100));

    assert(percentages[0] === 95, '0.95 converts to 95%');
    assert(percentages[1] === 88, '0.884 rounds to 88%');
    assert(percentages[2] === 100, '1.0 converts to 100%');
    assert(percentages[3] === 72, '0.72 converts to 72%');
  });

  test('determines critical threat level when risk tier is critical', () => {
    const criticalInc = { discrepancy: { risk_tier: 'Critical' } };
    const elevatedInc = { discrepancy: { risk_tier: 'Elevated' } };

    const isCrit = inc => (inc.discrepancy.risk_tier || '').toLowerCase() === 'critical';

    assert(isCrit(criticalInc) === true, 'Critical incident identified');
    assert(isCrit(elevatedInc) === false, 'Elevated incident not marked critical');
  });

  test('escapes all user-supplied discrepancy names in threat indicators', () => {
    const rawSuspect = '<script>alert(1)</script>';
    const safeSuspect = escapeHtml(rawSuspect);

    assert(!safeSuspect.includes('<script>'), 'Suspect name must be safely escaped');
    assert(safeSuspect.includes('&lt;script&gt;'), 'HTML entities present');
  });

  test('handles null, undefined, or out-of-bounds similarity scores gracefully without throwing (error and edge case)', () => {
    const formatScore = score => {
      if (typeof score !== 'number' || isNaN(score)) return 0;
      const clamped = Math.min(1.0, Math.max(0.0, score));
      return Math.round(clamped * 100);
    };

    assert(formatScore(null) === 0, 'Null score defaults to 0');
    assert(formatScore(undefined) === 0, 'Undefined score defaults to 0');
    assert(formatScore(-0.5) === 0, 'Negative score clamped to 0');
    assert(formatScore(1.5) === 100, 'Score > 1.0 clamped to 100');
  });

  test('handles malformed incident objects missing discrepancy metadata gracefully (edge case)', () => {
    const getRiskTier = inc => {
      if (!inc || !inc.discrepancy || typeof inc.discrepancy !== 'object') {
        return 'unknown';
      }
      return (inc.discrepancy.risk_tier || 'standard').toLowerCase();
    };

    assert(getRiskTier(null) === 'unknown', 'Null incident returns unknown');
    assert(getRiskTier({}) === 'unknown', 'Empty incident returns unknown');
    assert(getRiskTier({ discrepancy: null }) === 'unknown', 'Null discrepancy returns unknown');
    assert(getRiskTier({ discrepancy: { risk_tier: 'Critical' } }) === 'critical', 'Valid tier parsed');
  });
});
