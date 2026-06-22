// FileForge — Image to Text (OCR) Tool
// Uses Tesseract.js for client-side OCR

(function () {
  'use strict';

  const { setupDropZone, downloadBlob } = FFUtils;

  let currentFile = null;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const previewImg     = document.getElementById('previewImg');
  const ocrLang        = document.getElementById('ocrLang');
  const extractBtn     = document.getElementById('extractBtn');
  const progressWrap   = document.getElementById('progressWrap');
  const progressMsg    = document.getElementById('progressMsg');
  const progressPct    = document.getElementById('progressPct');
  const progressFill   = document.getElementById('progressFill');
  const ocrResult      = document.getElementById('ocrResult');
  const copyBtn        = document.getElementById('copyBtn');
  const downloadTxtBtn = document.getElementById('downloadTxtBtn');
  const resetBtn       = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });

  function handleFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    currentFile = f;
    const url = URL.createObjectURL(f);
    
    previewImg.onload = () => URL.revokeObjectURL(url);
    previewImg.src = url;
    
    actionPanel.classList.add('visible');
    dropZone.style.display = 'none';
    ocrResult.value = '';
    progressWrap.style.display = 'none';
    extractBtn.disabled = false;
  }

  extractBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    extractBtn.disabled = true;
    progressWrap.style.display = 'block';
    progressMsg.textContent = 'Initializing OCR Engine...';
    progressPct.textContent = '0%';
    progressFill.style.width = '0%';
    ocrResult.value = '';

    try {
      const worker = await Tesseract.createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            const p = Math.round(m.progress * 100);
            progressMsg.textContent = 'Extracting Text...';
            progressPct.textContent = `${p}%`;
            progressFill.style.width = `${p}%`;
          } else {
            progressMsg.textContent = m.status.charAt(0).toUpperCase() + m.status.slice(1);
          }
        }
      });
      
      await worker.loadLanguage(ocrLang.value);
      await worker.initialize(ocrLang.value);
      
      const { data: { text } } = await worker.recognize(currentFile);
      
      ocrResult.value = text;
      await worker.terminate();

      progressWrap.style.display = 'none';
      showToast('Text extracted successfully!', 'success');

    } catch (e) {
      showToast('Error extracting text: ' + e.message, 'error');
      progressWrap.style.display = 'none';
    }

    extractBtn.disabled = false;
  });

  copyBtn.addEventListener('click', async () => {
    if (!ocrResult.value) return;
    try {
      await navigator.clipboard.writeText(ocrResult.value);
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy text', 'error');
    }
  });

  downloadTxtBtn.addEventListener('click', () => {
    if (!ocrResult.value) return;
    const blob = new Blob([ocrResult.value], { type: 'text/plain;charset=utf-8' });
    const baseName = (currentFile?.name || 'image').replace(/\.[^.]+$/, '');
    downloadBlob(blob, `${baseName}-text.txt`);
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null;
    previewImg.src = '';
    ocrResult.value = '';
    actionPanel.classList.remove('visible');
    dropZone.style.display = '';
  });

})();
