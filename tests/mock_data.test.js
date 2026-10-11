/**
 * Automated tests for ui/js/mock_data.js
 * Validates initial mock benchmarks, incident schemas, and similarity ranges.
 */

import { INITIAL_BENCHMARKS, INITIAL_INCIDENTS, INITIAL_AUDIT_LOGS } from '../ui/js/mock_data.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/mock_data', () => {
  test('contains valid initial benchmarks with required fields', () => {
    assert(Array.isArray(INITIAL_BENCHMARKS), 'INITIAL_BENCHMARKS is an array');
    assert(INITIAL_BENCHMARKS.length > 0, 'INITIAL_BENCHMARKS is not empty');

    for (const bm of INITIAL_BENCHMARKS) {
      assert(Boolean(bm.id), 'Benchmark must have id');
      assert(Boolean(bm.user_id), 'Benchmark must have user_id');
      assert(Boolean(bm.canonical_username), 'Benchmark must have canonical_username');
      assert(Boolean(bm.community_role), 'Benchmark must have community_role');
      assert(Boolean(bm.avatar_perceptual_hash), 'Benchmark must have perceptual hash');
    }
  });

  test('contains valid pending incidents with discrepancy metadata', () => {
    assert(Array.isArray(INITIAL_INCIDENTS), 'INITIAL_INCIDENTS is an array');

    for (const inc of INITIAL_INCIDENTS) {
      assert(Boolean(inc.id), 'Incident must have id');
      assert(Boolean(inc.discrepancy), 'Incident must have discrepancy');
      assert(Boolean(inc.discrepancy.suspect_user_id), 'Incident must have suspect_user_id');
      assert(Boolean(inc.discrepancy.matched_benchmark_id), 'Incident must reference benchmark');

      const score = inc.discrepancy.string_similarity_score ?? inc.similarity_score;
      if (score !== undefined) {
        assert(score >= 0.0 && score <= 1.0, 'Similarity score must be between 0.0 and 1.0');
      }
    }
  });

  test('contains valid initial audit log entries', () => {
    assert(Array.isArray(INITIAL_AUDIT_LOGS), 'INITIAL_AUDIT_LOGS is an array');
    for (const log of INITIAL_AUDIT_LOGS) {
      assert(Boolean(log.id), 'Audit log must have id');
      assert(Boolean(log.action), 'Audit log must have action');
      assert(Boolean(log.timestamp), 'Audit log must have timestamp');
    }
  });
});
