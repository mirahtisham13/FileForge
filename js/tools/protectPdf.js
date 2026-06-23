// FileForge — Password Protect PDF (v4 — Final)
// Uses pdf-encrypt-lite (by PDFSmaller.com, MIT) for real RC4-128 bit encryption
// The library works directly with pdf-lib's object model to add proper /Encrypt dict

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;

  let currentFile = null;
  let resultBlob  = null;

  const dropZone          = document.getElementById('dropZone');
  const fileInput         = document.getElementById('fileInput');
  const fileList          = document.getElementById('fileList');
  const actionPanel       = document.getElementById('actionPanel');
  const pdfPassword       = document.getElementById('pdfPassword');
  const confirmPassword   = document.getElementById('confirmPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const protectBtn        = document.getElementById('protectBtn');
  const progressWrap      = document.getElementById('progressWrap');
  const progressFill      = document.getElementById('progressFill');
  const progressMsg       = document.getElementById('progressMsg');
  const resultPanel       = document.getElementById('resultPanel');
  const resultInfo        = document.getElementById('resultInfo');
  const downloadBtn       = document.getElementById('downloadBtn');
  const resetBtn          = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.innerHTML = '';
    fileList.appendChild(buildFileItem(file, resetState));
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    protectBtn.style.display = 'flex';
    pdfPassword.value = '';
    confirmPassword.value = '';
    pdfPassword.focus();
  }

  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = pdfPassword.type === 'password';
    pdfPassword.type      = isHidden ? 'text' : 'password';
    confirmPassword.type  = isHidden ? 'text' : 'password';
    togglePasswordBtn.textContent = isHidden ? '🙈' : '👁️';
  });

  protectBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    const pwd  = pdfPassword.value;
    const cpwd = confirmPassword.value;

    if (!pwd)            { showToast('Please enter a password', 'error'); pdfPassword.focus(); return; }
    if (pwd.length < 4)  { showToast('Password must be at least 4 characters', 'error'); return; }
    if (cpwd && cpwd !== pwd) { showToast('Passwords do not match!', 'error'); confirmPassword.focus(); return; }

    if (!window.PdfEncryptLite) {
      showToast('Encryption library not loaded. Please refresh the page.', 'error');
      return;
    }

    protectBtn.disabled = true;
    protectBtn.textContent = '🔒 Encrypting...';
    progressWrap.style.display = 'block';
    progressFill.style.width = '30%';
    progressMsg.textContent = 'Loading PDF...';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const pdfBytes = new Uint8Array(buf);

      progressFill.style.width = '60%';
      progressMsg.textContent = 'Encrypting with RC4-128...';

      const encryptedBytes = await window.PdfEncryptLite.encryptPDF(
        pdfBytes,
        pwd,
        pwd + '_owner'
      );

      progressFill.style.width = '100%';
      progressMsg.textContent = 'Done!';

      resultBlob = new Blob([encryptedBytes], { type: 'application/pdf' });

      setTimeout(() => { progressWrap.style.display = 'none'; }, 400);
      resultInfo.textContent = `PDF protected with password · ${formatBytes(resultBlob.size)}`;
      resultPanel.classList.add('visible');
      protectBtn.style.display = 'none';
      showToast('PDF protected successfully! 🎉', 'success');

    } catch (e) {
      console.error(e);
      progressWrap.style.display = 'none';
      showToast('Error: ' + e.message, 'error');
      protectBtn.style.display = 'flex';
    }

    protectBtn.disabled = false;
    protectBtn.textContent = '🔐 Protect PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const name = (currentFile?.name || 'document').replace(/\.pdf$/i, '') + '-protected.pdf';
      downloadBlob(resultBlob, name);
    }
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    currentFile = null;
    resultBlob  = null;
    fileList.innerHTML    = '';
    pdfPassword.value     = '';
    confirmPassword.value = '';
    pdfPassword.type      = 'password';
    confirmPassword.type  = 'password';
    togglePasswordBtn.textContent = '👁️';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    progressWrap.style.display = 'none';
    protectBtn.style.display = 'flex';
  }

})();
