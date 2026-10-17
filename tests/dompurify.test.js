/**
 * Automated tests for ui/js/dompurify.js
 * Validates XSS sanitization, script tag neutralization, and attribute whitelist behavior.
 */

import { DOMPurify } from '../ui/js/dompurify.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

describe('ui/js/dompurify', () => {
  test('strips dangerous <script> tags and executable payloads', () => {
    const dirty = '<div>Hello<script>alert("hacked")</script> World</div>';
    const clean = DOMPurify.sanitize(dirty);
    assert(!clean.includes('<script>'), 'Must not contain script tags');
    assert(!clean.includes('alert('), 'Must not contain script contents');
    assert(clean.includes('Hello'), 'Must preserve safe text before tag');
    assert(clean.includes('World'), 'Must preserve safe text after tag');
  });

  test('strips dangerous inline event handlers like onclick and onerror', () => {
    const dirty = '<img src="invalid.png" onerror="alert(1)" onclick="stealCookies()">';
    const clean = DOMPurify.sanitize(dirty);
    assert(!clean.includes('onerror'), 'Must strip onerror handler');
    assert(!clean.includes('onclick'), 'Must strip onclick handler');
    assert(clean.includes('<img'), 'Must preserve safe img element');
  });

  test('strips javascript: pseudo-protocol URIs in links and sources', () => {
    const dirty = '<a href="javascript:void(0)">Click Here</a>';
    const clean = DOMPurify.sanitize(dirty);
    assert(!clean.includes('javascript:'), 'Must strip javascript: href');
  });

  test('preserves legitimate safe formatting and structural tags', () => {
    const safeHtml = '<div class="alert-box"><strong>Warning:</strong> <span class="badge">Critical</span></div>';
    const clean = DOMPurify.sanitize(safeHtml);
    assert(clean.includes('class="alert-box"'), 'Preserves class attributes');
    assert(clean.includes('<strong>Warning:</strong>'), 'Preserves strong tag');
    assert(clean.includes('<span class="badge">'), 'Preserves span tag');
  });

  test('preserves select and option elements with value and selected attributes', () => {
    const selectHtml = '<select><option value="bm_1" selected>Moderator Lead</option></select>';
    const clean = DOMPurify.sanitize(selectHtml);
    assert(clean.includes('<select>'), 'Preserves select tag');
    assert(clean.includes('<option'), 'Preserves option tag');
    assert(clean.includes('value="bm_1"'), 'Preserves value attribute');
    assert(clean.includes('selected'), 'Preserves selected attribute');
  });

  test('handles null, undefined, and non-string inputs safely', () => {
    assert(DOMPurify.sanitize(null) === '', 'null returns empty string');
    assert(DOMPurify.sanitize(undefined) === '', 'undefined returns empty string');
    assert(DOMPurify.sanitize(42) === '42', 'Numbers converted safely');
  });

  test('correctly handles multi-element HTML fragments without stripping document body', () => {
    const fragment = '<article class="card"><h3>Title 1</h3></article><article class="card"><h3>Title 2</h3></article>';
    const clean = DOMPurify.sanitize(fragment);
    assert(clean.includes('Title 1') && clean.includes('Title 2'), 'Must preserve all article fragments in HTML');
    assert(clean.includes('class="card"'), 'Must preserve valid attributes on multiple fragments');
  });
});
