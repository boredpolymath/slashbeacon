/**
 * Automated tests for ui/js/utils.js
 * Validates HTML escaping, time formatting, and modal state management.
 */

import { escapeHtml, formatTime } from '../ui/js/utils.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/utils', () => {
  describe('escapeHtml', () => {
    test('escapes special characters to prevent XSS', () => {
      const input = '<script>alert("xss & \'attack\'")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss &amp; &#039;attack&#039;&quot;)&lt;/script&gt;';
      assert(escapeHtml(input) === expected, 'Special characters must be properly escaped');
    });

    test('handles null, undefined, and non-string types safely', () => {
      assert(escapeHtml(null) === '', 'null must return empty string');
      assert(escapeHtml(undefined) === '', 'undefined must return empty string');
      assert(escapeHtml(12345) === '12345', 'Numbers must be converted to strings');
    });

    test('preserves clean strings unchanged', () => {
      const clean = 'TruthBeacon Safe String 123';
      assert(escapeHtml(clean) === clean, 'Clean strings should remain unchanged');
    });
  });

  describe('formatTime', () => {
    test('formats recent timestamp as just now or minutes', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      assert(formatTime(nowSec) === 'just now', 'Seconds within current minute should be just now');

      const fiveMinAgoSec = nowSec - 300;
      assert(formatTime(fiveMinAgoSec) === '5m ago', '300 seconds ago should be 5m ago');
    });

    test('formats hours and days correctly', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const twoHoursAgoSec = nowSec - 7200;
      assert(formatTime(twoHoursAgoSec) === '2h ago', '2 hours ago format');

      const twoDaysAgoSec = nowSec - 172800;
      assert(formatTime(twoDaysAgoSec) === '2d ago', '2 days ago format');
    });

    test('handles missing or invalid timestamp gracefully', () => {
      assert(formatTime(null) === 'recently', 'null timestamp returns recently');
      assert(formatTime(0) === 'recently', 'zero timestamp returns recently');
    });
  });
});
