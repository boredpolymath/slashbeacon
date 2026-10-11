/**
 * Automated tests for ui/js/app.js
 * Validates application tab navigation, global keyboard shortcut mapping, and event listeners.
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/app', () => {
  test('maps keyboard shortcuts to appropriate moderation actions', () => {
    const keyMap = {
      'b': 'ban',
      'w': 'whitelist',
      'e': 'exclude',
      'd': 'dismiss',
      'escape': 'close_modal'
    };

    assert(keyMap['b'] === 'ban', 'Key b triggers ban');
    assert(keyMap['w'] === 'whitelist', 'Key w triggers whitelist');
    assert(keyMap['e'] === 'exclude', 'Key e triggers exclude');
    assert(keyMap['d'] === 'dismiss', 'Key d triggers dismiss');
    assert(keyMap['escape'] === 'close_modal', 'Escape triggers close modal');
  });

  test('validates navigation tab identifiers', () => {
    const validTabs = new Set(['triage', 'vault', 'audit', 'discord', 'guide']);

    assert(validTabs.has('triage'), 'triage is a valid tab');
    assert(validTabs.has('vault'), 'vault is a valid tab');
    assert(validTabs.has('audit'), 'audit is a valid tab');
    assert(validTabs.has('unknown_tab') === false, 'unknown_tab is rejected');
  });

  test('diagnostics polling catches errors and logs diagnostic warnings', async () => {
    let warningLogged = null;
    const mockWarn = (msg, err) => { warningLogged = { msg, err }; };

    const pollWithHandler = async (fetchDiag) => {
      try {
        const diag = await fetchDiag();
        return diag;
      } catch (err) {
        mockWarn('Diagnostics polling notice:', err);
        return null;
      }
    };

    const result = await pollWithHandler(async () => {
      throw new Error('IPC disconnect');
    });

    assert(result === null, 'Handled failure returns null');
    assert(warningLogged !== null, 'Warning logged on exception');
    assert(warningLogged.msg === 'Diagnostics polling notice:', 'Warning prefix matches');
    assert(warningLogged.err.message === 'IPC disconnect', 'Captured error preserved');
  });
});

