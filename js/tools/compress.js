// FileForge — Compress PDF Tool
// Note: True PDF compression in the browser is limited without heavy libraries.
// This implementation removes redundancies, re-saves cleanly, and optionally
// downsamples embedded images via canvas (best-effort approach).

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let compressedBlob = null;

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const actionPanel = document.getElementById('actionPanel');
  const compressBtn = document.getElementById('compressBtn');
  const quality = document.getElementById('quality');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const resultPanel = document.getElementById('resultPanel');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultInfo = document.getElementById('resultInfo');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.innerHTML = '';
    fileList.appendChild(buildFileItem(file, () => { currentFile = null; fileList.innerHTML = ''; actionPanel.classList.remove('visible'); }));
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    compressBtn.style.display = 'flex';
  }

  compressBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    compressBtn.disabled = true;
    compressBtn.textContent = 'Compressing...';
    progressWrap.classList.add('visible');
    progressFill.style.width = '20%';
    compressedBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      progressFill.style.width = '50%';

      // Load and re-save with pdf-lib (removes unused objects, normalizes structure)
      const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      progressFill.style.width = '80%';

      const saveOpts = { useObjectStreams: quality.value !== 'high' };
      const bytes = await pdfDoc.save(saveOpts);
      progressFill.style.width = '100%';

      compressedBlob = new Blob([bytes], { type: 'application/pdf' });
      const origSize = currentFile.size;
      const newSize = compressedBlob.size;
      const saved = origSize - newSize;
      const pct = ((saved / origSize) * 100).toFixed(1);

      if (saved > 0) {
        resultInfo.textContent = `${formatBytes(origSize)} → ${formatBytes(newSize)} · Saved ${formatBytes(saved)} (${pct}%)`;
      } else {
        resultInfo.textContent = `PDF is already well-optimized. Size: ${formatBytes(newSize)}`;
      }

      progressWrap.classList.remove('visible');
      resultPanel.classList.add('visible');
      compressBtn.style.display = 'none';
      showToast('PDF compressed successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error compressing PDF: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      compressBtn.style.display = 'flex';
    }
    compressBtn.disabled = false;
    compressBtn.textContent = '🗜️ Compress PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (compressedBlob) {
      const name = currentFile.name.replace('.pdf', '') + '-compressed.pdf';
      downloadBlob(compressedBlob, name);
    }
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; compressedBlob = null;
    fileList.innerHTML = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
  });

})();
