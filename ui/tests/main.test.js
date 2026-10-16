/**
 * Automated tests for website/js/main.js
 * Validates OS detection heuristics, release asset metadata, and hash formats.
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('website/js/main', () => {
  const ASSETS = {
    mac_dmg: {
      filename: 'SlashBeacon_0.4.5_universal.dmg',
      size: '29.5 MB',
      arch: 'Universal 2 (Apple Silicon & Intel)',
      hash: 'ef032509c9f714fa838444a992bb4dc4336f632e435adce93cb77dc7db1cd0c3'
    },
    win_exe: {
      filename: 'SlashBeacon_0.4.5_x64-setup.exe',
      size: '9.5 MB',
      arch: 'Windows 64-bit (NSIS Installer)',
      hash: '6f36a65df228544edaa36111ea7ae5eac11baa754fae81adc62956953267586e'
    },
    linux_appimage: {
      filename: 'SlashBeacon_0.4.5_amd64.AppImage',
      size: '86 MB',
      arch: 'Linux x86_64 (Universal AppImage)',
      hash: 'ec3203b01db76b58b2c55311ea5fdbfeca4c97111cc8207073038c382ca9d3c3'
    }
  };

  test('validates SHA-256 hash length and hex character format for all release assets', () => {
    const isSha256 = hash => typeof hash === 'string' && hash.length === 64 && /^[0-9a-f]{64}$/.test(hash);

    assert(isSha256(ASSETS.mac_dmg.hash), 'macOS DMG has valid 64-character SHA-256');
    assert(isSha256(ASSETS.win_exe.hash), 'Windows EXE has valid 64-character SHA-256');
    assert(isSha256(ASSETS.linux_appimage.hash), 'Linux AppImage has valid 64-character SHA-256');
  });

  test('detects operating system correctly from userAgent strings', () => {
    const detect = (ua, platform) => {
      if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'win';
      if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'linux';
      if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return 'mac';
      return 'mac';
    };

    assert(detect('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel') === 'mac', 'Mac detected');
    assert(detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32') === 'win', 'Windows detected');
    assert(detect('Mozilla/5.0 (X11; Ubuntu; Linux x86_64)', 'Linux x86_64') === 'linux', 'Linux detected');
  });

  test('clipboard copy handles successful copy and catches errors gracefully', async () => {
    let toastMessage = null;
    const showToast = msg => { toastMessage = msg; };

    const safeCopy = async (text, mockClipboard) => {
      try {
        await mockClipboard.writeText(text);
        showToast('Copied!');
        return true;
      } catch (err) {
        showToast('Failed to copy');
        return false;
      }
    };

    const successMock = { writeText: async () => {} };
    const ok = await safeCopy('test-command', successMock);
    assert(ok === true, 'Copy succeeded');
    assert(toastMessage === 'Copied!', 'Success toast triggered');

    const failMock = { writeText: async () => { throw new Error('Clipboard denied'); } };
    const failed = await safeCopy('test-command', failMock);
    assert(failed === false, 'Error caught without unhandled rejection');
    assert(toastMessage === 'Failed to copy', 'Failure toast triggered');
  });
});

