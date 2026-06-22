// FileForge — Service Worker
// Caches app shell for offline use

const CACHE_NAME = 'fileforge-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/pdfUtils.js',
  '/pages/merge.html',
  '/pages/split.html',
  '/pages/compress.html',
  '/pages/pdf-to-images.html',
  '/pages/images-to-pdf.html',
  '/pages/rotate.html',
  '/pages/rearrange.html',
  '/pages/watermark.html',
  '/pages/compress-image.html',
  '/pages/resize-image.html',
  '/pages/convert-image.html',
  '/pages/crop-image.html',
  '/pages/qr-generator.html',
  '/pages/protect-pdf.html',
  '/pages/rotate-image.html',
  '/pages/image-to-text.html',
  '/pages/unlock-pdf.html',
  '/pages/watermark-image.html',
  '/pages/metadata-viewer.html',
  '/pages/extract-pdf.html',
  '/pages/pdf-to-text.html',
  '/pages/zip-extractor.html',
  '/pages/blur-image.html',
  '/pages/remove-background.html',
  '/pages/zip-creator.html',
  '/pages/sign-pdf.html',
  '/pages/barcode-scanner.html',
  '/pages/size-calculator.html',
  '/pages/color-picker.html',
  '/pages/merge-text.html',
  '/pages/password-generator.html',
  '/js/tools/merge.js',
  '/js/tools/split.js',
  '/js/tools/compress.js',
  '/js/tools/pdfToImages.js',
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
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/manifest.json'
];

// Install: cache all app shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for CDN, cache-first for app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CDN resources: network-first with cache fallback
  if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      });
    })
  );
});
