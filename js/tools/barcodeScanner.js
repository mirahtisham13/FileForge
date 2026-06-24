// FileForge — Barcode & QR Scanner
// Uses html5-qrcode for browser-based scanning

(function () {
  'use strict';

  const actionPanel = document.getElementById('actionPanel');
  const scanResult  = document.getElementById('scanResult');
  const resultText  = document.getElementById('resultText');
  const formatBadge = document.getElementById('formatBadge');
  const copyBtn     = document.getElementById('copyBtn');
  const openLinkBtn = document.getElementById('openLinkBtn');
  
  let html5QrCode = null;

  // Initialize on page load
  function initScanner() {
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" }, // strictly use back camera
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.error("Camera start failed:", err);
      showToast("Camera access denied or no back camera found.", "error");
    });
  }

  function onScanSuccess(decodedText, decodedResult) {
    // Stop scanning once we get a result
    html5QrCode.pause();
    
    resultText.textContent = decodedText;
    formatBadge.textContent = decodedResult.result.format?.formatName || 'SCANNED';
    scanResult.style.display = 'block';
    
    // Check if URL
    if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
      openLinkBtn.style.display = 'inline-block';
      openLinkBtn.onclick = () => window.open(decodedText, '_blank');
    } else {
      openLinkBtn.style.display = 'none';
    }
    
    // Auto-resume after 5 seconds to scan again
    setTimeout(() => {
      scanResult.style.display = 'none';
      if (html5QrCode.getState() === 2 /* PAUSED */) {
        html5QrCode.resume();
      }
    }, 5000);
  }

  function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning
  }

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(resultText.textContent);
      showToast('Copied to clipboard!', 'success');
    } catch (e) {
      showToast('Failed to copy', 'error');
    }
  });

  // Start scanner when script loads
  document.addEventListener('DOMContentLoaded', () => {
    initScanner();
  });

})();
