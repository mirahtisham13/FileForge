// FileForge — Main App JS
// Theme, PWA, Toast, and Service Worker registration

(function () {
  'use strict';

  // --- Theme ---
  const THEME_KEY = 'ff-theme';
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');

  function getTheme() {
    return localStorage.getItem(THEME_KEY) ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
  }
  setTheme(getTheme());
  if (toggle) {
    toggle.addEventListener('click', () => {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // --- Toast ---
  window.showToast = function (msg, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.className = 'toast';
    }, duration);
  };

  // --- PWA Install ---
  let deferredPrompt = null;
  const installBanner = document.getElementById('installBanner');
  const installBtn = document.getElementById('installBtn');
  const dismissBtn = document.getElementById('dismissInstall');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner && !localStorage.getItem('ff-install-dismissed')) {
      setTimeout(() => installBanner.classList.add('show'), 3000);
    }
  });
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') showToast('FileForge installed! 🎉', 'success');
        deferredPrompt = null;
        installBanner.classList.remove('show');
      }
    });
  }
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      installBanner.classList.remove('show');
      localStorage.setItem('ff-install-dismissed', '1');
    });
  }

  // --- Service Worker ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // A new version is available and installed
              const toast = document.getElementById('toast');
              if (toast) {
                toast.innerHTML = 'New version available! <button onclick="window.location.reload()" style="margin-left:12px;padding:4px 10px;background:#fff;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.8rem;">Update Now</button>';
                toast.className = 'toast show success';
                toast.style.pointerEvents = 'all'; // Ensure button is clickable
                // Do not auto-hide this toast
              }
            }
          });
        });
      }).catch(err => console.error('SW Reg Error:', err));
    });
  }

  // --- Navbar scroll shadow ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.boxShadow = window.scrollY > 10 ? '0 4px 24px rgba(0,0,0,0.2)' : '';
    }, { passive: true });
  }

  // --- Animate tool cards on scroll ---
  if ('IntersectionObserver' in window) {
    const cards = document.querySelectorAll('.tool-card, .feature-item');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
          }, i * 60);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(c => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(20px)';
      c.style.transition = 'opacity 0.4s ease, transform 0.4s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease';
      obs.observe(c);
    });
  }

})();
