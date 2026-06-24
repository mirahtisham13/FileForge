// FileForge — Crop PDF Tool
// Uses pdf-lib to set a new crop box for every page based on margins

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let resultBlob = null;

  const dropZone    = document.getElementById('dropZone');
  const fileInput   = document.getElementById('fileInput');
  const actionPanel = document.getElementById('actionPanel');

  const topIn       = document.getElementById('marginTop');
  const bottomIn    = document.getElementById('marginBottom');
  const leftIn      = document.getElementById('marginLeft');
  const rightIn     = document.getElementById('marginRight');

  const applyBtn    = document.getElementById('applyBtn');
  const progressWrap= document.getElementById('progressWrap');
  const progressMsg = document.getElementById('progressMsg');
  const progressPct = document.getElementById('progressPct');
  const progressFill= document.getElementById('progressFill');
  
  const resultPanel = document.getElementById('resultPanel');
  const resultInfo  = document.getElementById('resultInfo');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn    = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = f;
    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
  }

  applyBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    applyBtn.disabled = true;
    progressWrap.style.display = 'block';
    resultPanel.style.display = 'none';

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const doc = await PDFDocument.load(buf);
      const pages = doc.getPages();
      const total = pages.length;

      const mT = parseInt(topIn.value) || 0;
      const mB = parseInt(bottomIn.value) || 0;
      const mL = parseInt(leftIn.value) || 0;
      const mR = parseInt(rightIn.value) || 0;

      for (let i = 0; i < total; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Calculate new crop box based on current box
        const cropBox = page.getCropBox() || page.getMediaBox() || { x:0, y:0, width: width, height: height };
        
        const newX = cropBox.x + mL;
        const newY = cropBox.y + mB;
        const newW = cropBox.width - mL - mR;
        const newH = cropBox.height - mT - mB;
        
        // Don't crop if invalid margins (e.g., overlapping)
        if (newW > 0 && newH > 0) {
          page.setCropBox(newX, newY, newW, newH);
        }

        const pct = Math.round(((i + 1) / total) * 100);
        progressMsg.textContent = `Cropping page ${i + 1} of ${total}...`;
        progressPct.textContent = `${pct}%`;
        progressFill.style.width = `${pct}%`;
        
        // Yield to UI
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }

      progressMsg.textContent = 'Saving PDF...';
      const bytes = await doc.save();
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      const outName = currentFile.name.replace(/\.pdf$/i, '') + '-cropped.pdf';
      downloadBtn.onclick = () => downloadBlob(resultBlob, outName);

      progressWrap.style.display = 'none';
      resultPanel.style.display = 'block';
      resultInfo.textContent = `Cropped ${total} pages successfully · ${formatBytes(resultBlob.size)}`;
      showToast('PDF cropped! 🎉', 'success');

    } catch (e) {
      console.error(e);
      showToast('Error: ' + e.message, 'error');
      progressWrap.style.display = 'none';
    }

    applyBtn.disabled = false;
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null;
    resultBlob = null;
    actionPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    progressWrap.style.display = 'none';
    dropZone.style.display = '';
    fileInput.value = '';
    progressFill.style.width = '0%';
  });

})();
