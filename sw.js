// FileForge — Service Worker v5
// Strategy: Network-first for everything (always try live, fall back to cache)
// This prevents the "page not available" error when cache is stale or incomplete.

const CACHE_NAME = 'fileforge-v26';

const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/pdfUtils.js',
  '/js/pdf-encrypt-lite.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',

  // Pages
  '/pages/merge',
  '/pages/split',
  '/pages/compress',
  '/pages/images-to-pdf',
  '/pages/rotate',
  '/pages/rearrange',
  '/pages/watermark',
  '/pages/compress-image',
  '/pages/resize-image',
  '/pages/convert-image',
  '/pages/crop-image',
  '/pages/qr-generator',
  '/pages/protect-pdf',
  '/pages/rotate-image',
  '/pages/image-to-text',
  '/pages/unlock-pdf',
  '/pages/watermark-image',
  '/pages/metadata-viewer',
  '/pages/extract-pdf',
  '/pages/pdf-to-text',
  '/pages/pdf-to-word',
  '/pages/pdf-page-numbering',
  '/pages/crop-pdf',
  '/pages/zip-extractor',
  '/pages/blur-image',
  '/pages/remove-background',
  '/pages/zip-creator',
  '/pages/sign-pdf',
  '/pages/barcode-scanner',
  '/pages/size-calculator',
  '/pages/color-picker',
  '/pages/barcode-generator',
  '/pages/merge-text',
  '/pages/password-generator',

  // Tool scripts
  '/js/tools/merge.js',
  '/js/tools/split.js',
  '/js/tools/compress.js',
  '/js/tools/imagesToPdf.js',
  '/js/tools/rotate.js',
  '/js/tools/rearrange.js',
  '/js/tools/watermark.js',
  '/js/tools/compressImage.js',
  '/js/tools/resizeImage.js',
  '/js/tools/convertImage.js',
  '/js/tools/cropImage.js',
  '/js/tools/qrGenerator.js',
  '/js/tools/protectPdf.js',
  '/js/tools/rotateImage.js',
  '/js/tools/imageToText.js',
  '/js/tools/unlockPdf.js',
  '/js/tools/watermarkImage.js',
  '/js/tools/metadataViewer.js',
  '/js/tools/extractPdf.js',
  '/js/tools/pdfToText.js',
  '/js/tools/pdfToWord.js',
  '/js/tools/zipExtractor.js',
  '/js/tools/blurImage.js',
  '/js/tools/removeBackground.js',
  '/js/tools/zipCreator.js',
  '/js/tools/signPdf.js',
  '/js/tools/barcodeScanner.js',
  '/js/tools/sizeCalculator.js',
  '/js/tools/colorPicker.js',
  '/js/tools/mergeText.js',
  '/js/tools/passwordGenerator.js',
];

// ── Install: cache assets one by one (don't let one failure break everything) ──
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each file individually so one 404 doesn't break the whole cache
      const results = await Promise.allSettled(
        ASSETS.map(url =>
          fetch(url)
            .then(res => {
              if (res && res.status === 200) return cache.put(url, res);
            })
            .catch(() => { /* ignore individual failures */ })
        )
      );
    })
  );
});

// ── Activate: remove ALL old caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-first, cache as fallback ───────────────────────────────────
// This is the KEY fix: always try the network first.
// Only serve from cache if the network is unavailable (true offline mode).
// This prevents "page not available" when cache is stale/empty.

self.addEventListener('fetch', (event) => {
  // --- WEB SHARE TARGET INTERCEPTION ---
  if (event.request.method === 'POST' && event.request.url.includes('/share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll('shared_file');
        
        if (files && files.length > 0) {
          // Open IndexedDB and store the file temporarily
          await new Promise((resolve, reject) => {
            const request = indexedDB.open('FileForgeDB', 1);
            request.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('sharedFiles')) {
                db.createObjectStore('sharedFiles', { keyPath: 'id' });
              }
            };
            request.onsuccess = (e) => {
              const db = e.target.result;
              // Add a defensive check in case the object store wasn't created
              if (!db.objectStoreNames.contains('sharedFiles')) {
                db.close();
                // If version is 1 and no store, we need to bump version to trigger onupgradeneeded
                const req2 = indexedDB.open('FileForgeDB', 2);
                req2.onupgradeneeded = (e2) => {
                  e2.target.result.createObjectStore('sharedFiles', { keyPath: 'id' });
                };
                req2.onsuccess = (e2) => {
                  const db2 = e2.target.result;
                  const tx = db2.transaction('sharedFiles', 'readwrite');
                  tx.objectStore('sharedFiles').put({ id: 'latest_share', files: files });
                  tx.oncomplete = () => resolve();
                };
                return;
              }
              const tx = db.transaction('sharedFiles', 'readwrite');
              const store = tx.objectStore('sharedFiles');
              // Store all files in an array
              store.put({ id: 'latest_share', files: files });
              tx.oncomplete = () => resolve();
              tx.onerror = (err) => reject(err);
            };
            request.onerror = (err) => reject(err);
          });
        }
        
        // Determine redirect target based on file type (if it's a PDF, go to compress PDF, else compress image)
        let redirectUrl = '/pages/compress-image.html?shared=true';
        if (files && files.length > 0 && files[0].type === 'application/pdf') {
          redirectUrl = '/pages/compress.html?shared=true';
        }
        
        return Response.redirect(redirectUrl, 303);
      } catch (err) {
        console.error('[SW] Share Target Error:', err);
        return Response.redirect('/', 303);
      }
    })());
    return;
  }

  // Skip non-GET requests and browser-extension requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(networkRes => {
        // Update cache with fresh response
        if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkRes;
      })
      .catch(async () => {
        const offlineHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline — FileForge</title>
            <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f0e17;color:#fff;}
            .box{text-align:center;padding:40px;}.emoji{font-size:4rem;}.title{font-size:1.5rem;font-weight:700;margin:16px 0 8px;}
            .sub{color:#888;margin-bottom:24px;}a{color:#6c63ff;}</style></head>
            <body><div class="box"><div class="emoji">📡</div>
            <div class="title">You're offline</div>
            <div class="sub">Connect to the internet to use FileForge tools.</div>
            <a href="/">Go to Home</a></div></body></html>`;

        try {
          // Network failed — serve from cache
          let cached = await caches.match(event.request, { ignoreSearch: true });
          if (cached) return cached;
          
          const urlObj = new URL(event.request.url);
          
          // If clean URL, try appending .html using absolute URL to avoid TypeErrors
          if (!urlObj.pathname.includes('.') && !urlObj.pathname.endsWith('/')) {
            const htmlUrl = new URL(urlObj.pathname + '.html', urlObj.origin).href;
            cached = await caches.match(htmlUrl, { ignoreSearch: true });
            if (cached) return cached;
          }
          
          // If directory, try index.html using absolute URL
          if (urlObj.pathname.endsWith('/')) {
            const indexUrl = new URL(urlObj.pathname + 'index.html', urlObj.origin).href;
            cached = await caches.match(indexUrl, { ignoreSearch: true });
            if (cached) return cached;
          }

          // Last resort: return friendly offline page for navigations/HTML
          if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
            return new Response(offlineHtml, { headers: { 'Content-Type': 'text/html' } });
          }
          // Return empty 503 for other resources
          return new Response('', { status: 503, statusText: 'Offline' });
        } catch (err) {
          // Bulletproof fallback in case of unhandled exception
          return new Response(offlineHtml, { headers: { 'Content-Type': 'text/html' } });
        }
      })
  );
});
