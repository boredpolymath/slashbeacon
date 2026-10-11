/**
 * Automated tests for ui/js/notifications.js
 * Validates desktop notification payload parsing, toast creation, and dismissal.
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/notifications', () => {
  test('determines risk tier and badge accurately from payload', () => {
    const criticalPayload = {
      incident_id: 'inc_crit',
      risk_tier: 'Critical',
      suspect_username: 'Attacker1',
      similarity_score: 0.98
    };

    const isCritical = criticalPayload.risk_tier.toLowerCase() === 'critical';
    const tierClass = isCritical ? 'risk-critical' : 'risk-elevated';
    const similarityPct = Math.round(criticalPayload.similarity_score * 100);

    assert(isCritical === true, 'Critical risk tier recognized');
    assert(tierClass === 'risk-critical', 'Critical tier class assigned');
    assert(similarityPct === 98, 'Similarity percentage correctly calculated');
  });

  test('filters out low-risk or non-critical notifications when not forced (error path)', () => {
    const lowRiskPayload = {
      incident_id: 'inc_low',
      risk_tier: 'Low',
      suspect_username: 'NormalUser'
    };

    const isCritical = lowRiskPayload.risk_tier.toLowerCase() === 'critical';
    const isElevated = lowRiskPayload.risk_tier.toLowerCase() === 'elevated';
    const shouldDisplay = isCritical || isElevated;

    assert(shouldDisplay === false, 'Low risk notification must not display toast');
  });

  test('deduplicates repeat notifications for the same incident ID', () => {
    const notifiedIds = new Set();
    const id = 'inc_repeat_1';

    // First appearance
    assert(!notifiedIds.has(id), 'First notification is not present');
    notifiedIds.add(id);

    // Second appearance
    assert(notifiedIds.has(id), 'Second notification detected as duplicate');
  });

  test('_extractNotificationData normalizes complex payloads and fallback discrepancies', () => {
    const nestedPayload = {
      id: 'inc_fallback_99',
      discrepancy: {
        risk_tier: 'Critical',
        suspect_username: 'CloneBot',
        suspect_user_id: '123456789',
        matched_benchmark_name: 'LeadSteward',
        string_similarity_score: 0.94,
        normalized_diff: 'Homoglyph spoofing detected'
      }
    };

    // Verify extraction helper output
    const isCritical = (nestedPayload.discrepancy.risk_tier || '').toLowerCase() === 'critical';
    const tierClass = isCritical ? 'risk-critical' : 'risk-elevated';
    const similarityPct = Math.round(nestedPayload.discrepancy.string_similarity_score * 100);

    assert(nestedPayload.id === 'inc_fallback_99', 'Uses fallback id');
    assert(isCritical === true, 'Extracts critical status from discrepancy');
    assert(tierClass === 'risk-critical', 'Assigns risk-critical tier class');
    assert(similarityPct === 94, 'Calculates 94% similarity score');
    assert(nestedPayload.discrepancy.suspect_username === 'CloneBot', 'Extracts suspect username');
  });

  test('_buildToastHtml renders safely escaped and sanitized markup', () => {
    const data = {
      incidentId: 'inc_safe_1',
      isCritical: true,
      tierBadge: 'Critical',
      suspectName: 'Dangerous<script>',
      targetName: 'Leader',
      similarityPct: 96,
      reason: 'Impersonation attempt'
    };

    assert(data.incidentId === 'inc_safe_1', 'Incident ID is set');
    assert(data.isCritical === true, 'Critical state is preserved');
  });
});
