// FileForge — Unlock PDF Tool
// Uses pdf-lib to decrypt a PDF using the provided password and save it without one

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let resultBlob = null;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const fileList       = document.getElementById('fileList');
  const actionPanel    = document.getElementById('actionPanel');
  const pdfPassword    = document.getElementById('pdfPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const unlockBtn      = document.getElementById('unlockBtn');
  const resultPanel    = document.getElementById('resultPanel');
  const resultInfo     = document.getElementById('resultInfo');
  const downloadBtn    = document.getElementById('downloadBtn');
  const resetBtn       = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.innerHTML = '';
    fileList.appendChild(buildFileItem(file, resetState));
    
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    unlockBtn.style.display = 'flex';
    pdfPassword.value = '';
    pdfPassword.focus();
  }

  togglePasswordBtn.addEventListener('click', () => {
    if (pdfPassword.type === 'password') {
      pdfPassword.type = 'text';
      togglePasswordBtn.textContent = '🙈';
    } else {
      pdfPassword.type = 'password';
      togglePasswordBtn.textContent = '👁️';
    }
  });

  unlockBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    const pwd = pdfPassword.value.trim();
    if (!pwd) { showToast('Please enter the current password', 'error'); pdfPassword.focus(); return; }

    unlockBtn.disabled = true;
    unlockBtn.textContent = 'Decrypting...';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      
      // Load the document using the password
      const pdfDoc = await PDFDocument.load(buf, { password: pwd });

      // Save without encryption
      const bytes = await pdfDoc.save({ useObjectStreams: false });

      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      resultInfo.textContent = `Password removed successfully · ${formatBytes(resultBlob.size)}`;
      
      resultPanel.classList.add('visible');
      unlockBtn.style.display = 'none';
      showToast('PDF unlocked! 🎉', 'success');

    } catch (e) {
      if (e.message.includes('Incorrect password')) {
        showToast('Incorrect password. Please try again.', 'error');
      } else if (!e.message.includes('password') && !e.message.includes('encrypt')) {
        showToast('File is not encrypted or is corrupted.', 'error');
      } else {
        showToast('Error unlocking PDF: ' + e.message, 'error');
      }
    }

    unlockBtn.disabled = false;
    unlockBtn.textContent = '🔓 Unlock PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const name = (currentFile?.name || 'document').replace('.pdf', '') + '-unlocked.pdf';
      downloadBlob(resultBlob, name);
    }
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    currentFile = null;
    resultBlob = null;
    fileList.innerHTML = '';
    pdfPassword.value = '';
    pdfPassword.type = 'password';
    togglePasswordBtn.textContent = '👁️';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    dropZone.style.display = '';
  }

})();
