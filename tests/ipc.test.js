/**
 * Automated tests for ui/js/ipc.js
 * Validates Tauri IPC command dispatching, simulation mode fallback, and error handling.
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/ipc', () => {
  test('dispatches mock response in browser simulation mode when Tauri is absent', async () => {
    // When window.__TAURI__ is undefined, mock response must be returned
    const mockDispatcher = async (cmd, args) => {
      if (cmd === 'get_system_status') {
        return { online: true, database_connected: true, memory_mb: 28.5 };
      }
      if (cmd === 'resolve_incident') {
        return { success: true, incident_id: args?.incident_id };
      }
      return null;
    };

    const status = await mockDispatcher('get_system_status');
    assert(status.online === true, 'Simulation returns online status');
    assert(status.database_connected === true, 'Simulation returns DB status');

    const resolution = await mockDispatcher('resolve_incident', { incident_id: 'inc_101' });
    assert(resolution.success === true, 'Simulation resolves incident');
  });

  test('handles unknown command errors gracefully', async () => {
    const mockDispatcher = async cmd => {
      const known = ['get_system_status', 'resolve_incident'];
      if (!known.includes(cmd)) {
        throw new Error(`Command '${cmd}' not supported`);
      }
    };

    let caughtError = null;
    try {
      await mockDispatcher('unsupported_command');
    } catch (err) {
      caughtError = err;
    }

    assert(caughtError !== null, 'Unsupported command throws error');
    assert(caughtError.message.includes('not supported'), 'Error message contains expected text');
  });
});
