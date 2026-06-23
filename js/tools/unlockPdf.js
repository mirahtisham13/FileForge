// FileForge — Unlock PDF Tool (v2)
//
// pdf-lib CANNOT decrypt encrypted PDFs — the { password } option is not implemented.
// Correct approach:
//   1. Use pdf.js to open & decrypt the PDF (it handles RC4/AES passwords correctly)
//   2. Render each page to canvas at high resolution
//   3. Rebuild a new clean PDF from those images using pdf-lib (no encryption)
//
// This is the same render-then-rebuild pattern used by compress.js

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let resultBlob  = null;

  const dropZone          = document.getElementById('dropZone');
  const fileInput         = document.getElementById('fileInput');
  const fileList          = document.getElementById('fileList');
  const actionPanel       = document.getElementById('actionPanel');
  const pdfPassword       = document.getElementById('pdfPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const unlockBtn         = document.getElementById('unlockBtn');
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
    unlockBtn.style.display = 'flex';
    pdfPassword.value = '';
    pdfPassword.focus();
  }

  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = pdfPassword.type === 'password';
    pdfPassword.type = isHidden ? 'text' : 'password';
    togglePasswordBtn.textContent = isHidden ? '🙈' : '👁️';
  });

  unlockBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    const pwd = pdfPassword.value;
    if (!pwd) { showToast('Please enter the current password', 'error'); pdfPassword.focus(); return; }

    unlockBtn.disabled = true;
    unlockBtn.textContent = 'Decrypting...';
    progressWrap.style.display = 'block';
    progressFill.style.width = '5%';
    progressMsg.textContent = 'Loading encrypted PDF...';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const pdfData = new Uint8Array(buf);

      progressFill.style.width = '15%';
      progressMsg.textContent = 'Verifying password...';

      // pdf.js handles decryption correctly — pass the password here
      let pdfjsDoc;
      try {
        pdfjsDoc = await pdfjsLib.getDocument({
          data: pdfData,
          password: pwd
        }).promise;
      } catch (e) {
        if (e.name === 'PasswordException') {
          showToast('Incorrect password. Please try again.', 'error');
        } else {
          showToast('Error: ' + e.message, 'error');
        }
        throw e; // re-throw to hit the outer catch cleanup
      }

      const numPages = pdfjsDoc.numPages;
      progressFill.style.width = '20%';
      progressMsg.textContent = `PDF decrypted! Rebuilding ${numPages} page(s)...`;

      // Rebuild as a clean PDF with no encryption
      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= numPages; i++) {
        const pct = 20 + ((i - 1) / numPages) * 70;
        progressFill.style.width = pct + '%';
        progressMsg.textContent = `Rebuilding page ${i} of ${numPages}...`;

        const page     = await pdfjsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // 2x for crisp output

        const canvas = document.createElement('canvas');
        canvas.width  = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const imgData   = canvas.toDataURL('image/jpeg', 0.95);
        const base64    = imgData.split(',')[1];
        const imgBytes  = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const jpgImage  = await newPdfDoc.embedJpg(imgBytes);

        // Use original page dimensions (scale 1)
        const vp1      = page.getViewport({ scale: 1 });
        const newPage  = newPdfDoc.addPage([vp1.width, vp1.height]);
        newPage.drawImage(jpgImage, { x: 0, y: 0, width: vp1.width, height: vp1.height });
      }

      progressFill.style.width = '95%';
      progressMsg.textContent = 'Saving unlocked PDF...';

      const unlockedBytes = await newPdfDoc.save({ useObjectStreams: true });
      resultBlob = new Blob([unlockedBytes], { type: 'application/pdf' });

      progressFill.style.width = '100%';
      setTimeout(() => { progressWrap.style.display = 'none'; }, 400);

      resultInfo.textContent = `Password removed · ${formatBytes(currentFile.size)} → ${formatBytes(resultBlob.size)}`;
      resultPanel.classList.add('visible');
      unlockBtn.style.display = 'none';
      showToast('PDF unlocked successfully! 🎉', 'success');

    } catch (e) {
      // Only show generic error if not already handled above
      if (e.name !== 'PasswordException') {
        console.error(e);
      }
      progressWrap.style.display = 'none';
      unlockBtn.style.display = 'flex';
    }

    unlockBtn.disabled = false;
    unlockBtn.textContent = '🔓 Unlock PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const name = (currentFile?.name || 'document').replace(/\.pdf$/i, '') + '-unlocked.pdf';
      downloadBlob(resultBlob, name);
    }
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    currentFile = null;
    resultBlob  = null;
    fileList.innerHTML = '';
    pdfPassword.value  = '';
    pdfPassword.type   = 'password';
    togglePasswordBtn.textContent = '👁️';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    progressWrap.style.display = 'none';
    unlockBtn.style.display = 'flex';
  }

})();
