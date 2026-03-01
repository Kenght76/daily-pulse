/* ============================================================
   app.js — Main App Controller
   Init, routing, navigation, service worker registration
   ============================================================ */

const App = (() => {
  let currentPage = 'dashboard';

  const init = async () => {
    // Load config first
    await Store.loadConfig();

    // Set today's date in header
    const dateEl = document.getElementById('header-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
    }

    // Apply app title from config
    const titleEl = document.querySelector('.header-title');
    if (titleEl) titleEl.textContent = Store.getLabel('appTitle', 'Daily Pulse');

    // Apply saved theme
    Themes.init();

    // Wire up bottom navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page) navigateTo(page);
      });
    });

    // Wire up settings button
    document.getElementById('btn-settings').addEventListener('click', () => {
      navigateTo('settings');
    });

    // Load home
    navigateTo('home');

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.warn('SW registration failed:', err));
    }

    // PWA Install Prompt
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallBanner();
    });

    // Start reminders system
    Reminders.start();

    // Apply custom labels
    applyLabels();

    // Mobile keyboard scroll fix — scroll focused inputs into view
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });

    console.log('Daily Pulse initialized ✓');
  };

  // --- Install Banner ---
  const showInstallBanner = () => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner fade-in';
    banner.innerHTML = `
      <div class="install-banner-text">
        <strong>Install Daily Pulse</strong>
        <span>Add to your home screen for the full experience</span>
      </div>
      <button class="app-btn primary small" id="install-btn">Install</button>
      <button class="install-dismiss" id="install-dismiss">✕</button>
    `;
    document.getElementById('app').appendChild(banner);

    document.getElementById('install-btn').addEventListener('click', async () => {
      if (window._deferredPrompt) {
        window._deferredPrompt.prompt();
        const result = await window._deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          UI.toast('App installed! 🎉');
        }
        window._deferredPrompt = null;
      }
      banner.remove();
    });

    document.getElementById('install-dismiss').addEventListener('click', () => {
      banner.remove();
    });
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window._deferredPrompt = e;
    showInstallBanner();
  });

  const navigateTo = (page) => {
    currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Scroll to top
    document.getElementById('page-container').scrollTop = 0;

    // Render page
    UI.navigate(page);
  };

  const applyLabels = () => {
    const settings = Store.getSettings();
    if (!settings.customLabels) return;
    document.querySelectorAll('[data-label]').forEach(el => {
      const key = el.dataset.label;
      if (settings.customLabels[key]) {
        el.textContent = settings.customLabels[key];
      }
    });
  };

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigateTo };
})();
