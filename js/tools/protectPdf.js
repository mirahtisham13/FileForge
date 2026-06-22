// FileForge — Password Protect PDF
// Uses pdf-lib to encrypt the PDF with a user-provided password

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
  const protectBtn     = document.getElementById('protectBtn');
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
    protectBtn.style.display = 'flex';
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

  protectBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    const pwd = pdfPassword.value.trim();
    if (!pwd) { showToast('Please enter a password', 'error'); pdfPassword.focus(); return; }

    protectBtn.disabled = true;
    protectBtn.textContent = 'Encrypting...';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const pdfDoc = await PDFDocument.load(buf);

      // Encrypt document
      const bytes = await pdfDoc.save({
        useObjectStreams: false,
        updateFieldAppearances: false,
        addOcxInfo: false,
        objectsPerTick: 50,
        userPassword: pwd,
        ownerPassword: pwd,
        permissions: {
          printing: 'highResolution',
          modifying: true,
          copying: true,
          annotating: true,
          fillingForms: true,
          documentAssembly: true,
          contentAccessibility: true
        }
      });

      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      resultInfo.textContent = `File secured successfully · ${formatBytes(resultBlob.size)}`;
      
      resultPanel.classList.add('visible');
      protectBtn.style.display = 'none';
      showToast('PDF protected! 🎉', 'success');

    } catch (e) {
      // Handle already encrypted files
      if (e.message.includes('encrypted')) {
        showToast('This PDF is already encrypted or password protected.', 'error');
      } else {
        showToast('Error protecting PDF: ' + e.message, 'error');
      }
    }

    protectBtn.disabled = false;
    protectBtn.textContent = '🔐 Protect PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const name = (currentFile?.name || 'document').replace('.pdf', '') + '-protected.pdf';
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
