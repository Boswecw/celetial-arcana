// PWA Installation and Service Worker Registration
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    // Register service worker
    this.registerServiceWorker();

    // Setup install prompt
    this.setupInstallPrompt();

    // Check if already installed
    this.checkInstallationStatus();

    // Setup install button
    this.setupInstallButton();

    // Setup offline detection
    this.setupOfflineDetection();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('PWA install prompt triggered');
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstalledMessage();
    });
  }

  checkInstallationStatus() {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('Running as installed PWA');
    }
  }

  showInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.style.display = 'flex';
      installButton.classList.add('pwa-install-visible');
    } else {
      this.createInstallButton();
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.style.display = 'none';
      installButton.classList.remove('pwa-install-visible');
    }
  }

  createInstallButton() {
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-install-button';
    installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
      </svg>
      Install App
    `;

    document.body.appendChild(installButton);
    this.setupInstallButton();

    // Make sure the button becomes visible after creation
    requestAnimationFrame(() => {
      installButton.classList.add('pwa-install-visible');
    });
  }

  setupInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.addEventListener('click', () => {
        this.installPWA();
      });
    }
  }

  async installPWA() {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }

    try {
      // Show install prompt
      this.deferredPrompt.prompt();

      // Wait for user response
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
      } else {
        console.log('User dismissed PWA installation');
      }

      this.deferredPrompt = null;
      this.hideInstallButton();

    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  }

  showInstalledMessage() {
    // Create success message
    const message = document.createElement('div');
    message.className = 'pwa-success-message';
    message.innerHTML = `
      <div class="pwa-success-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span>Celestia Arcana installed successfully!</span>
      </div>
    `;

    document.body.appendChild(message);

    // Remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  showUpdateAvailable() {
    // Create update notification
    const updateBanner = document.createElement('div');
    updateBanner.className = 'pwa-update-banner';
    updateBanner.innerHTML = `
      <div class="pwa-update-content">
        <span>A new version is available!</span>
        <button id="pwa-update-btn" class="pwa-update-button">Update</button>
        <button id="pwa-dismiss-btn" class="pwa-dismiss-button">×</button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    // Handle update button
    document.getElementById('pwa-update-btn').addEventListener('click', () => {
      window.location.reload();
    });

    // Handle dismiss button
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      updateBanner.remove();
    });
  }

  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      this.showConnectionStatus('offline');
    });
  }

  showConnectionStatus(status) {
    const statusBar = document.getElementById('connection-status') || this.createStatusBar();

    if (status === 'offline') {
      statusBar.textContent = 'You are offline. Some features may be limited.';
      statusBar.className = 'connection-status offline';
      statusBar.style.display = 'block';
    } else {
      statusBar.textContent = 'You are back online!';
      statusBar.className = 'connection-status online';
      statusBar.style.display = 'block';

      setTimeout(() => {
        statusBar.style.display = 'none';
      }, 2000);
    }
  }

  createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.id = 'connection-status';
    statusBar.className = 'connection-status';
    document.body.appendChild(statusBar);
    return statusBar;
  }
}

// Initialize PWA when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const pwaManager = new PWAManager();
    window.pwaManager = pwaManager;
  });
}

// iOS Safari specific PWA detection
function isIOSPWA() {
  return window.navigator.standalone === true;
}

// Add iOS PWA meta tags dynamically if needed
function addIOSPWAMeta() {
  if (typeof document === 'undefined') return;

  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Celestia Arcana' }
    ];

    metaTags.forEach(tag => {
      const meta = document.createElement('meta');
      meta.name = tag.name;
      meta.content = tag.content;
      document.head.appendChild(meta);
    });
  }
}

// Initialize iOS PWA features
if (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
  addIOSPWAMeta();
}
