// FileForge — Barcode Generator Tool
// Uses JsBarcode to generate 1D barcodes

(function () {
  'use strict';

  const dataInput = document.getElementById('barcodeData');
  const formatSel = document.getElementById('barcodeFormat');
  const colorIn   = document.getElementById('barcodeColor');
  const displayIn = document.getElementById('displayValue');
  const canvas    = document.getElementById('barcodeCanvas');
  const downloadBtn = document.getElementById('downloadBtn');

  // Load initial barcode
  dataInput.value = 'FILEFORGE-2024';
  generateBarcode();

  // Event Listeners
  dataInput.addEventListener('input', generateBarcode);
  formatSel.addEventListener('change', generateBarcode);
  colorIn.addEventListener('input', generateBarcode);
  displayIn.addEventListener('change', generateBarcode);

  downloadBtn.addEventListener('click', () => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `barcode-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Barcode downloaded! 🎉', 'success');
    } catch (e) {
      showToast('Failed to download barcode', 'error');
    }
  });

  function generateBarcode() {
    const text = dataInput.value.trim();
    if (!text) {
      downloadBtn.disabled = true;
      return;
    }

    try {
      JsBarcode(canvas, text, {
        format: formatSel.value,
        lineColor: colorIn.value,
        width: 2,
        height: 100,
        displayValue: displayIn.value === 'true',
        margin: 16,
        background: '#ffffff'
      });
      downloadBtn.disabled = false;
    } catch (e) {
      console.warn("JsBarcode Error:", e);
      downloadBtn.disabled = true;
      // Some formats (like EAN-13) require specific lengths. If invalid, we catch it silently.
    }
  }

})();
