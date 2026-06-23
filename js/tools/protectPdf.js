// FileForge — Password Protect PDF (v3)
// 
// Strategy: Use pdf.js to render each page to canvas, then use jsPDF
// (which has built-in working RC4/AES encryption) to create a new
// password-protected PDF from those rendered pages.
//
// jsPDF encryption docs: https://artskydj.github.io/jsPDF/docs/jsPDF.html

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

    if (!pwd)          { showToast('Please enter a password', 'error'); pdfPassword.focus(); return; }
    if (pwd.length < 4){ showToast('Password must be at least 4 characters', 'error'); return; }
    if (cpwd && cpwd !== pwd) { showToast('Passwords do not match!', 'error'); confirmPassword.focus(); return; }

    // Ensure jsPDF is loaded
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      showToast('PDF library not loaded yet. Please wait a moment and try again.', 'error');
      return;
    }

    protectBtn.disabled = true;
    protectBtn.textContent = '🔒 Encrypting...';
    progressWrap.style.display = 'block';
    progressFill.style.width = '5%';
    progressMsg.textContent = 'Loading PDF...';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const pdfData = new Uint8Array(buf);

      progressMsg.textContent = 'Reading pages...';
      progressFill.style.width = '15%';

      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const numPages = pdfjsDoc.numPages;

      // Get jsPDF constructor (handles both module styles)
      const { jsPDF } = window.jspdf || window;

      // Determine page size from first page
      const firstPage = await pdfjsDoc.getPage(1);
      const firstVp   = firstPage.getViewport({ scale: 1 });
      const isLandscape = firstVp.width > firstVp.height;

      // Create jsPDF with encryption
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [firstVp.width, firstVp.height],
        encryption: {
          userPassword:    pwd,
          ownerPassword:   pwd + '_ff_owner',
          userPermissions: ['print']  // allow printing but restrict copy/modify
        }
      });

      for (let i = 1; i <= numPages; i++) {
        const pct = 15 + ((i - 1) / numPages) * 75;
        progressFill.style.width = pct + '%';
        progressMsg.textContent  = `Processing page ${i} of ${numPages}...`;

        const page     = await pdfjsDoc.getPage(i);
        const scale    = 2; // 2x for good quality
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width  = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        // Add new page for all pages after the first
        if (i > 1) {
          const vp1 = page.getViewport({ scale: 1 });
          doc.addPage([vp1.width, vp1.height], vp1.width > vp1.height ? 'landscape' : 'portrait');
        }

        // Get current page size in pts
        const pageVp1 = page.getViewport({ scale: 1 });
        doc.addImage(imgData, 'JPEG', 0, 0, pageVp1.width, pageVp1.height);
      }

      progressFill.style.width = '95%';
      progressMsg.textContent  = 'Saving encrypted PDF...';

      const pdfOutput = doc.output('arraybuffer');
      resultBlob = new Blob([pdfOutput], { type: 'application/pdf' });

      progressFill.style.width = '100%';
      setTimeout(() => { progressWrap.style.display = 'none'; }, 500);

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
