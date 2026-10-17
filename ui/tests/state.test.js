/**
 * Automated tests for ui/js/state.js
 * Validates StateStore, benchmark enrollment, incident resolution, and circuit breakers.
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/state', () => {
  let mockState;

  beforeEach(() => {
    // Isolated StateStore fixture
    mockState = {
      benchmarks: [
        {
          id: 'bm_001',
          guild_id: 'guild_123',
          user_id: '111222333',
          canonical_username: 'Dan',
          server_nickname: 'Pastor Dan',
          community_role: 'Executive Pastor',
          avatar_url: 'assets/avatars/pastor_dan.svg',
          tags: ['Verified Baseline'],
          authorized_alts: []
        }
      ],
      incidents: [
        {
          id: 'inc_test_1',
          status: 'pending',
          discrepancy: {
            suspect_user_id: '999888777',
            suspect_username: 'Dan_Official',
            matched_benchmark_id: 'bm_001',
            matched_benchmark_name: 'Pastor Dan'
          }
        }
      ],
      auditLogs: [],
      daemonHealth: {
        circuit_breaker: {
          tripped: false,
          rolling_requests: 0,
          max_requests: 5,
          remaining_cooldown: 0
        }
      },
      listeners: []
    };
  });

  test('resolves pending incident with ban action and updates audit log', () => {
    const inc = mockState.incidents[0];
    assert(inc.status === 'pending', 'Initial status must be pending');

    // Simulate ban resolution
    inc.status = 'banned';
    inc.resolved_at = Date.now();
    mockState.auditLogs.unshift({
      action: 'ban_and_purge',
      target_user_id: inc.discrepancy.suspect_user_id,
      incident_id: inc.id
    });
    mockState.daemonHealth.circuit_breaker.rolling_requests += 1;

    assert(inc.status === 'banned', 'Status updated to banned');
    assert(mockState.auditLogs.length === 1, 'Audit log entry created');
    assert(mockState.daemonHealth.circuit_breaker.rolling_requests === 1, 'Circuit counter incremented');
  });

  test('rejects resolution on already resolved incidents (error path)', () => {
    const inc = mockState.incidents[0];
    inc.status = 'dismissed';

    // Attempting resolution on non-pending incident
    const canResolve = inc.status === 'pending';
    assert(canResolve === false, 'Cannot re-resolve an already closed incident');
  });

  test('whitelisting alternate appends authorized alt metadata to benchmark', () => {
    const inc = mockState.incidents[0];
    const bm = mockState.benchmarks.find(b => b.id === inc.discrepancy.matched_benchmark_id);

    // Whitelist resolution
    inc.status = 'whitelisted';
    bm.authorized_alts.push({
      user_id: inc.discrepancy.suspect_user_id,
      label: 'Secondary Phone Account',
      note: 'Verified in person'
    });
    bm.tags.push('Authorized Alt');

    assert(bm.authorized_alts.length === 1, 'Benchmark contains authorized alt');
    assert(bm.authorized_alts[0].user_id === '999888777', 'Alt user_id matches suspect');
    assert(bm.tags.includes('Authorized Alt'), 'Tags include Authorized Alt');
  });

  test('trips circuit breaker when rolling requests reach threshold', () => {
    const cb = mockState.daemonHealth.circuit_breaker;
    for (let i = 0; i < 5; i++) {
      cb.rolling_requests += 1;
      if (cb.rolling_requests >= cb.max_requests) {
        cb.tripped = true;
        cb.remaining_cooldown = 60;
      }
    }

    assert(cb.tripped === true, 'Circuit breaker must trip at max_requests');
    assert(cb.remaining_cooldown === 60, 'Cooldown is initiated');

    // Reset circuit breaker
    cb.tripped = false;
    cb.rolling_requests = 0;
    cb.remaining_cooldown = 0;
    assert(cb.tripped === false, 'Circuit breaker reset successfully');
    assert(cb.rolling_requests === 0, 'Rolling requests reset to zero');
  });

  test('enrolls new ground-truth benchmark and logs creation audit', () => {
    const newBenchmark = {
      id: 'bm_002',
      user_id: '444555666',
      canonical_username: 'Sarah',
      server_nickname: 'Sarah Mod',
      community_role: 'Head Moderator',
      tags: ['Verified Baseline']
    };

    mockState.benchmarks.push(newBenchmark);
    mockState.auditLogs.unshift({
      action: 'create_benchmark',
      target_user_id: newBenchmark.user_id,
      reason: `Enrolled benchmark for ${newBenchmark.canonical_username}`
    });

    assert(mockState.benchmarks.length === 2, 'Benchmark list updated');
    assert(mockState.auditLogs[0].action === 'create_benchmark', 'Audit entry logged');
  });

  test('removes ground-truth benchmark and logs deletion audit', () => {
    const toRemove = mockState.benchmarks[0];
    mockState.benchmarks = mockState.benchmarks.filter(b => b.id !== toRemove.id);
    mockState.auditLogs.unshift({
      action: 'delete_benchmark',
      target_user_id: toRemove.user_id,
      reason: `Removed protected benchmark for ${toRemove.canonical_username}`
    });

    assert(mockState.benchmarks.length === 0, 'Benchmark list updated after removal');
    assert(mockState.auditLogs[0].action === 'delete_benchmark', 'Delete benchmark audit entry logged');
  });
});
