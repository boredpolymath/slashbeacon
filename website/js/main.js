// TruthBeacon - GitHub Pages Interactive Logic
// OS Detection, Asset Routing, Dynamic Filtering, and Clipboard Utilities

document.addEventListener('DOMContentLoaded', () => {
  initOSDetection();
  initPlatformTabs();
  initVerifyTabs();
  initShowcaseTabs();
  initCopyButtons();
  initLightbox();
});

// Release Asset Configuration (v0.4.0)
const RELEASE_BASE_URL = 'https://github.com/boredpolymath/truth-beacon/releases/download/v0.4.0/';
const ASSETS = {
  mac_dmg: {
    filename: 'TruthBeacon_0.4.0_universal.dmg',
    size: '29.5 MB',
    arch: 'Universal 2 (Apple Silicon & Intel)',
    label: 'Download for macOS',
    sub: 'Universal DMG (macOS 10.15+)',
    hash: '8af70d32f142f0d2316f6886cf8955a6b982a334e91392595883191d555115de'
  },
  win_exe: {
    filename: 'TruthBeacon_0.4.0_x64-setup.exe',
    size: '9.5 MB',
    arch: 'Windows 64-bit (NSIS Installer)',
    label: 'Download for Windows',
    sub: 'Windows 10 / 11 (64-bit Installer)',
    hash: '6f36a65df228544edaa36111ea7ae5eac11baa754fae81adc62956953267586e'
  },
  linux_appimage: {
    filename: 'TruthBeacon_0.4.0_amd64.AppImage',
    size: '86 MB',
    arch: 'Linux x86_64 (Universal AppImage)',
    label: 'Download for Linux',
    sub: 'x86_64 AppImage (Any Distro)',
    hash: 'ec3203b01db76b58b2c55311ea5fdbfeca4c97111cc8207073038c382ca9d3c3'
  }
};

// 1. Detect User OS and Update Hero Primary Button
function initOSDetection() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  let os = 'mac'; // default
  let detectedName = 'macOS';

  if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    os = 'win';
    detectedName = 'Windows (64-bit)';
  } else if (/Linux/i.test(platform) || /Linux/i.test(ua)) {
    os = 'linux';
    detectedName = 'Linux (x86_64)';
  } else if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
    os = 'mac';
    detectedName = 'macOS (Universal 2)';
  }

  const primaryBtn = document.getElementById('hero-primary-download-btn');
  const osLabel = document.getElementById('hero-detected-os');
  const metaSize = document.getElementById('hero-meta-size');
  const metaArch = document.getElementById('hero-meta-arch');
  const metaFormat = document.getElementById('hero-meta-format');

  let targetAsset;
  if (os === 'win') {
    targetAsset = ASSETS.win_exe;
  } else if (os === 'linux') {
    targetAsset = ASSETS.linux_appimage;
  } else {
    targetAsset = ASSETS.mac_dmg;
  }

  if (primaryBtn) {
    primaryBtn.href = RELEASE_BASE_URL + targetAsset.filename;
    primaryBtn.setAttribute('data-filename', targetAsset.filename);
    const btnLabelEl = primaryBtn.querySelector('.btn-label-text');
    if (btnLabelEl) btnLabelEl.textContent = targetAsset.label;
  }

  if (osLabel) osLabel.textContent = detectedName;
  if (metaSize) metaSize.textContent = targetAsset.size;
  if (metaArch) metaArch.textContent = targetAsset.arch;
  if (metaFormat) metaFormat.textContent = targetAsset.filename.split('.').pop().toUpperCase();
}

// 2. Platform Switcher & Inline Download Card Logic
function openPlatformSite(platform) {
  if (!platform) return;
  const tabs = document.querySelectorAll('.platform-tabs .tab-btn');
  const card = document.getElementById('inline-site-window');
  const views = document.querySelectorAll('.inline-platform-view');

  const wasClosed = !card || card.style.display === 'none' || !card.classList.contains('is-open');

  tabs.forEach(t => {
    const isSelected = t.getAttribute('data-platform') === platform;
    t.classList.toggle('active', isSelected);
    t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });

  views.forEach(view => {
    const isTarget = view.getAttribute('data-view-platform') === platform;
    view.style.display = isTarget ? 'block' : 'none';
  });

  if (card) {
    if (wasClosed) {
      card.style.display = 'block';
      card.classList.remove('is-closing');
      card.classList.add('is-open');
    }
  }
}

function closePlatformSite() {
  const tabs = document.querySelectorAll('.platform-tabs .tab-btn');
  const card = document.getElementById('inline-site-window');

  tabs.forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });

  if (card && card.classList.contains('is-open')) {
    card.classList.remove('is-open');
    card.classList.add('is-closing');
    setTimeout(() => {
      card.style.display = 'none';
      card.classList.remove('is-closing');
    }, 240);
  } else if (card) {
    card.style.display = 'none';
  }
}

function initPlatformTabs() {
  const tabs = document.querySelectorAll('.platform-tabs .tab-btn');
  const closeBtn = document.getElementById('inline-site-close-btn');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const platform = tab.getAttribute('data-platform');
      if (tab.classList.contains('active')) {
        closePlatformSite();
      } else {
        openPlatformSite(platform);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closePlatformSite);

  initHeroPlatformLink();
  initInlineCommandCopy();
}

function initHeroPlatformLink() {
  const heroOtherLink = document.getElementById('hero-other-platforms-link');
  if (!heroOtherLink) return;

  heroOtherLink.addEventListener('click', () => {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    let targetOS = 'mac';
    if (/Win/i.test(platform) || /Windows/i.test(ua)) {
      targetOS = 'win';
    } else if (/Linux/i.test(platform) || /Linux/i.test(ua)) {
      targetOS = 'linux';
    }
    openPlatformSite(targetOS);
  });
}

function initInlineCommandCopy() {
  document.querySelectorAll('.btn-copy-inline-cmd').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cmd = btn.getAttribute('data-cmd');
      if (!cmd) return;
      try {
        await navigator.clipboard.writeText(cmd);
        showToast('Verification command copied!');
        const origChildren = Array.from(btn.childNodes);
        btn.textContent = '✓ Copied';
        setTimeout(() => {
          btn.replaceChildren(...origChildren);
        }, 1800);
      } catch (err) {
        console.error('Copy command failed:', err);
        showToast('Failed to copy command');
      }
    });
  });
}

// 3. Verification Terminal Snippets Tab Switcher
const VERIFY_SNIPPETS = {
  macos: {
    title: 'terminal — zsh (macOS)',
    code: `# Verify SHA-256 Checksum on macOS\nshasum -a 256 TruthBeacon_0.4.0_universal.dmg\n\n# Expected Output:\n# 8af70d32f142f0d2316f6886cf8955a6b982a334e91392595883191d555115de  TruthBeacon_0.4.0_universal.dmg`
  },
  linux: {
    title: 'bash — terminal (Linux)',
    code: `# Verify SHA-256 Checksum on Linux\nsha256sum TruthBeacon_0.4.0_amd64.AppImage\n\n# Expected Output:\n# ec3203b01db76b58b2c55311ea5fdbfeca4c97111cc8207073038c382ca9d3c3  TruthBeacon_0.4.0_amd64.AppImage`
  },
  windows: {
    title: 'PowerShell — Windows 10 / 11',
    code: `# Verify SHA-256 Checksum in Windows PowerShell\nGet-FileHash TruthBeacon_0.4.0_x64-setup.exe -Algorithm SHA256\n\n# Expected Output:\n# 6F36A65DF228544EDAA36111EA7AE5EAC11BAA754FAE81ADC62956953267586E`
  },
  gpg: {
    title: 'terminal — GnuPG Detached Signature',
    code: `# Download SHA256SUMS and signature:\ncurl -LO https://github.com/boredpolymath/truth-beacon/releases/download/v0.4.0/SHA256SUMS.txt\ncurl -LO https://github.com/boredpolymath/truth-beacon/releases/download/v0.4.0/SHA256SUMS.txt.asc\n\n# Verify GPG Detached Signature:\ngpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt\n\n# Batch check all files:\nshasum -a 256 -c SHA256SUMS.txt`
  }
};

function initVerifyTabs() {
  const tabs = document.querySelectorAll('.verify-nav .verify-tab-btn');
  const codeEl = document.getElementById('verify-code-content');
  const titleEl = document.getElementById('terminal-title-text');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const key = tab.getAttribute('data-verify-tab');
      if (VERIFY_SNIPPETS[key] && codeEl) {
        codeEl.textContent = VERIFY_SNIPPETS[key].code;
        if (titleEl) titleEl.textContent = VERIFY_SNIPPETS[key].title;
      }
    });
  });

  const copyCodeBtn = document.getElementById('btn-copy-terminal-code');
  if (copyCodeBtn && codeEl) {
    copyCodeBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent);
        showToast('Command copied to clipboard!');
      } catch (err) {
        console.warn('Clipboard copy notice:', err);
        showToast('Failed to copy to clipboard');
      }
    });
  }
}

// 4. Feature Showcase Tab Switcher
const SHOWCASE_ITEMS = {
  protection: {
    title: 'Active Protection Dashboard',
    desc: 'Real-time telemetry and continuous threat detection. Visual shield status indicates real-time memory-safe daemon integrity.',
    points: [
      'Visual green shield heartbeat verifying zero-privilege daemon status',
      'Real-time count of total scans, quarantined payloads, and threats blocked',
      'Instant toggle for live Discord client memory & asset hooks'
    ],
    imgSrc: 'assets/screenshot_protected.png',
    imgAlt: 'TruthBeacon Active Protection Dashboard'
  },
  alerts: {
    title: 'Instant Threat Isolation & Alerts',
    desc: 'Automated defense against token grabbers, malicious Discord Nitro scams, homoglyph impersonations, and avatar cloning.',
    points: [
      'Comprehensive threat severity classification (Critical, Warning, Info)',
      'Deterministic isolation of malicious webhooks and hijacked process sockets',
      'Direct one-click threat review with payload signatures and stack traces'
    ],
    imgSrc: 'assets/screenshot_alerts.png',
    imgAlt: 'TruthBeacon Threat Alerts View'
  },
  activity: {
    title: 'Audit-Grade Activity Journal',
    desc: 'Full immutable local logging of all inspected events, hashes, and daemon diagnostics without any external telemetry.',
    points: [
      'Sub-millisecond latency timestamps with category tags',
      'Filterable by severity level, threat category, and timestamp',
      'Exportable audit trail in JSON & CSV for security team investigations'
    ],
    imgSrc: 'assets/screenshot_activity_log.png',
    imgAlt: 'TruthBeacon Activity Log View'
  },
  discord: {
    title: 'Frictionless Discord Integration',
    desc: 'Effortless setup guide providing immediate out-of-the-box protection for Discord Stable, PTB, Canary, and Discord Development builds.',
    points: [
      'Automatic detection of installed Discord client release channels',
      'Guided configuration with step-by-step security hardening instructions',
      'Zero modification of official Discord binaries or API credentials'
    ],
    imgSrc: 'assets/screenshot_discord_setup.png',
    imgAlt: 'TruthBeacon Discord Setup Guide'
  }
};

function initShowcaseTabs() {
  const tabs = document.querySelectorAll('.showcase-tabs .showcase-tab');
  const titleEl = document.getElementById('showcase-item-title');
  const descEl = document.getElementById('showcase-item-desc');
  const pointsEl = document.getElementById('showcase-item-points');
  const imgEl = document.getElementById('showcase-item-img');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const key = tab.getAttribute('data-showcase');
      const item = SHOWCASE_ITEMS[key];
      if (!item) return;

      if (titleEl) titleEl.textContent = item.title;
      if (descEl) descEl.textContent = item.desc;
      if (imgEl) {
        imgEl.src = item.imgSrc;
        imgEl.alt = item.imgAlt;
      }
      if (pointsEl) {
        pointsEl.replaceChildren();
        item.points.forEach(pt => {
          const li = document.createElement('li');
          li.className = 'showcase-point';
          const icon = document.createElement('span');
          icon.className = 'showcase-point-icon';
          icon.textContent = '✓';
          const text = document.createElement('span');
          text.textContent = pt;
          li.appendChild(icon);
          li.appendChild(text);
          pointsEl.appendChild(li);
        });
      }
    });
  });
}

// 5. Copy Buttons & Toast Notifications
function initCopyButtons() {
  document.querySelectorAll('.btn-copy-checksum').forEach(btn => {
    btn.addEventListener('click', async () => {
      const hash = btn.getAttribute('data-hash');
      if (!hash) return;

      try {
        await navigator.clipboard.writeText(hash);
        showToast('SHA-256 Checksum copied!');
        const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        checkSvg.setAttribute('width', '14');
        checkSvg.setAttribute('height', '14');
        checkSvg.setAttribute('viewBox', '0 0 24 24');
        checkSvg.setAttribute('fill', 'none');
        checkSvg.setAttribute('stroke', '#23a55a');
        checkSvg.setAttribute('stroke-width', '2.5');
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', '20 6 9 17 4 12');
        checkSvg.appendChild(polyline);

        const origChildren = Array.from(btn.childNodes);
        btn.replaceChildren(checkSvg);
        setTimeout(() => {
          btn.replaceChildren(...origChildren);
        }, 1800);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
        showToast('Failed to copy checksum');
      }
    });
  });
}

function showToast(message) {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.replaceChildren();
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.textContent = '✓';
  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  toast.appendChild(iconSpan);
  toast.appendChild(document.createTextNode(' '));
  toast.appendChild(textSpan);
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// 6. Screenshot Lightbox
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const previewFrame = document.querySelector('.showcase-preview-frame');

  if (!modal || !modalImg) return;

  if (previewFrame) {
    previewFrame.addEventListener('click', () => {
      const currentImg = document.getElementById('showcase-item-img');
      if (currentImg) {
        modalImg.src = currentImg.src;
        modal.classList.add('open');
      }
    });
  }

  const closeModal = () => modal.classList.remove('open');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}
