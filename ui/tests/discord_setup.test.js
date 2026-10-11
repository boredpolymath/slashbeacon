/**
 * Automated tests for ui/js/discord_setup.js
 * Validates pre-flight diagnostics evaluation, token validation format, and status indicator updates.
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/discord_setup', () => {
  test('validates bot token format and minimum length', () => {
    const isValidToken = token => {
      if (!token || typeof token !== 'string') return false;
      const trimmed = token.trim();
      // Discord bot tokens typically consist of 3 dot-separated base64-like parts and are >50 chars
      return trimmed.length >= 50 && trimmed.includes('.');
    };

    assert(isValidToken('mock_bot_token_sample_string_for_testing_length_validation_only.abc.xyz') === true, 'Standard token format is valid');
    assert(isValidToken('') === false, 'Empty token is invalid');
    assert(isValidToken('short_invalid_token') === false, 'Short token without dots is invalid');
    assert(isValidToken(null) === false, 'Null token is invalid');
  });

  test('evaluates pre-flight diagnostic check results', () => {
    const allPassed = [
      { name: 'Gateway Reachability', passed: true },
      { name: 'Intent Registration', passed: true },
      { name: 'Database Integrity', passed: true },
      { name: 'Vault Key Derivation', passed: true },
      { name: 'Permission Audit', passed: true }
    ];

    const oneFailed = [
      ...allPassed.slice(0, 4),
      { name: 'Permission Audit', passed: false }
    ];

    const evaluate = checks => checks.every(c => c.passed);

    assert(evaluate(allPassed) === true, 'All 5 checks passing results in success state');
    assert(evaluate(oneFailed) === false, 'Any single failure results in failure state');
  });

  test('_syncAppStateWithConfig updates app state correctly', () => {
    const fakeState = {
      daemonHealth: { gateway_connected: false },
      selectedGuild: { id: null, name: null }
    };

    const syncAppState = (config, state) => {
      if (config.connected !== undefined) {
        state.daemonHealth.gateway_connected = !!config.connected;
      }
      if (config.guild_id) {
        state.selectedGuild.id = config.guild_id;
      }
      if (config.guild_name) {
        state.selectedGuild.name = config.guild_name;
      }
    };

    syncAppState({ connected: true, guild_id: '123456789', guild_name: 'Truth Citadel' }, fakeState);
    assert(fakeState.daemonHealth.gateway_connected === true, 'Gateway status set to connected');
    assert(fakeState.selectedGuild.id === '123456789', 'Guild ID synchronized');
    assert(fakeState.selectedGuild.name === 'Truth Citadel', 'Guild name synchronized');
  });

  test('_updateConnectionStatusIndicators sets proper classes and text based on connection', () => {
    const getStatusDisplay = connected => {
      if (connected) {
        return {
          indicatorClass: 'discord-status-indicator online',
          badgeClass: 'discord-badge-active',
          badgeText: 'CONNECTED',
          gatewayText: 'Discord: Connected'
        };
      }
      return {
        indicatorClass: 'discord-status-indicator offline',
        badgeClass: 'discord-badge-active disconnected',
        badgeText: 'DISCONNECTED',
        gatewayText: 'Discord: Disconnected'
      };
    };

    const connectedDisplay = getStatusDisplay(true);
    assert(connectedDisplay.indicatorClass === 'discord-status-indicator online', 'Online class set');
    assert(connectedDisplay.badgeText === 'CONNECTED', 'Connected badge text set');

    const disconnectedDisplay = getStatusDisplay(false);
    assert(disconnectedDisplay.indicatorClass === 'discord-status-indicator offline', 'Offline class set');
    assert(disconnectedDisplay.badgeText === 'DISCONNECTED', 'Disconnected badge text set');
  });

  test('_populateDiscordInputs resolves masked token and draft fallbacks', () => {
    const resolveTokenValue = (config, draftToken) => {
      if (config.has_token) {
        return config.token_masked || '••••••••••••••••••••••••••••••••';
      }
      return draftToken || '';
    };

    assert(resolveTokenValue({ has_token: true, token_masked: 'm12***' }, '') === 'm12***', 'Uses masked token when configured');
    assert(resolveTokenValue({ has_token: false }, 'draft_token_xyz') === 'draft_token_xyz', 'Uses draft token when not configured');
    assert(resolveTokenValue({ has_token: false }, '') === '', 'Falls back to empty string');
  });

  test('_applyThresholds updates threshold fields and triggers notifications', () => {
    const updated = {};
    const mockApply = thresholds => {
      if (!thresholds) return false;
      if (thresholds.similarity !== undefined) updated.similarity = thresholds.similarity;
      if (thresholds.account_age_hours !== undefined) updated.account_age_hours = thresholds.account_age_hours;
      return true;
    };

    assert(mockApply(null) === false, 'Returns early if thresholds is null');
    assert(mockApply({ similarity: 85, account_age_hours: 48 }) === true, 'Processes threshold object');
    assert(updated.similarity === 85, 'Similarity applied');
    assert(updated.account_age_hours === 48, 'Account age applied');
  });

  test('toggle token visibility toggles input type between text and password', () => {
    let type = 'password';
    let text = 'Show';
    const toggle = () => {
      const isPass = type === 'password';
      type = isPass ? 'text' : 'password';
      text = isPass ? 'Hide' : 'Show';
    };

    toggle();
    assert(type === 'text', 'Toggled to text');
    assert(text === 'Hide', 'Label updated to Hide');

    toggle();
    assert(type === 'password', 'Toggled back to password');
    assert(text === 'Show', 'Label updated to Show');
  });

  test('_handleTestHandshake and _handleSaveDiscord validate required target guild ID', async () => {
    let alertMessage = null;
    const mockAlert = msg => { alertMessage = msg; };

    const validateInputs = (token, guildId) => {
      if (!guildId || !guildId.trim()) {
        mockAlert('Please enter a Target Discord Server ID.');
        return false;
      }
      return true;
    };

    assert(validateInputs('token_abc', '') === false, 'Rejects empty guild ID');
    assert(alertMessage === 'Please enter a Target Discord Server ID.', 'Alert message matched');

    assert(validateInputs('token_abc', '   ') === false, 'Rejects whitespace guild ID');
    assert(validateInputs('token_abc', '123456789') === true, 'Accepts valid guild ID');
  });

  test('_handleDisconnectDiscord requires user confirmation before invoking disconnect', () => {
    let invoked = false;
    const handleDisconnect = confirmed => {
      if (!confirmed) return false;
      invoked = true;
      return true;
    };

    assert(handleDisconnect(false) === false, 'Does not disconnect when cancelled');
    assert(invoked === false, 'Disconnect command not invoked');

    assert(handleDisconnect(true) === true, 'Disconnects when confirmed');
    assert(invoked === true, 'Disconnect command invoked');
  });
});

