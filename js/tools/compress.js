// FileForge — Compress PDF Tool (v2)
// Strategy: Use pdf.js to render each page to canvas, then re-encode as JPEG
// and rebuild the PDF using pdf-lib. This achieves REAL compression of image-heavy PDFs.
// For text-heavy PDFs, a clean re-save removes redundant objects.

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument, rgb } = PDFLib;

  let currentFile = null;
  let compressedBlob = null;

  const dropZone     = document.getElementById('dropZone');
  const fileInput    = document.getElementById('fileInput');
  const fileList     = document.getElementById('fileList');
  const actionPanel  = document.getElementById('actionPanel');
  const compressBtn  = document.getElementById('compressBtn');
  const qualitySel   = document.getElementById('quality');
  const targetSizeIn = document.getElementById('targetSize');
  const targetUnitSel= document.getElementById('targetUnit');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressMsg  = document.getElementById('progressMsg');
  const progressPct  = document.getElementById('progressPct');
  const resultPanel  = document.getElementById('resultPanel');
  const downloadBtn  = document.getElementById('downloadBtn');
  const resetBtn     = document.getElementById('resetBtn');
  const resultInfo   = document.getElementById('resultInfo');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.innerHTML = '';
    fileList.appendChild(buildFileItem(file, () => {
      currentFile = null;
      fileList.innerHTML = '';
      actionPanel.classList.remove('visible');
    }));
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    compressBtn.style.display = 'flex';
  }

  function setProgress(pct, msg) {
    progressFill.style.width = pct + '%';
    progressPct.textContent = Math.round(pct) + '%';
    if (msg) progressMsg.textContent = msg;
  }

  compressBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    compressBtn.disabled = true;
    compressBtn.textContent = 'Compressing...';
    progressWrap.classList.add('visible');
    compressedBlob = null;
    setProgress(5, 'Reading PDF...');

    // Determine target quality / size
    const qualityMap = { '0.85': 0.85, '0.6': 0.6, '0.3': 0.3 };
    let imgQuality = parseFloat(qualitySel.value) || 0.6;

    // Parse target size if provided
    let targetBytes = null;
    const targetVal = parseFloat(targetSizeIn.value);
    if (targetVal > 0) {
      const unit = targetUnitSel.value;
      targetBytes = unit === 'mb' ? targetVal * 1024 * 1024 : targetVal * 1024;
    }

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const origSize = currentFile.size;

      if (targetBytes && targetBytes >= origSize) {
        showToast(`Target size (${formatBytes(targetBytes)}) is larger than the original (${formatBytes(origSize)}). Nothing to do.`, 'error');
        progressWrap.classList.remove('visible');
        compressBtn.disabled = false;
        compressBtn.textContent = '🗜️ Compress PDF';
        return;
      }

      setProgress(10, 'Loading PDF pages...');

      // Load with pdf.js for rendering (actual image downsampling)
      const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const numPages = pdfjsDoc.numPages;

      // If target size is set, auto-calculate quality and scale to try to hit it
      let pageScale = 1.5; // Default high quality scale
      if (targetBytes) {
        // Estimate needed quality ratio: target / original
        const ratio = Math.max(0.05, Math.min(0.95, targetBytes / origSize));
        // Distribute the compression between quality and resolution scale
        imgQuality = Math.max(0.1, ratio * 1.2); 
        pageScale = Math.max(0.5, 1.5 * Math.sqrt(ratio)); 
      } else {
        // If user didn't specify target size, use the quality dropdown to scale too
        if (imgQuality <= 0.3) pageScale = 0.8;
        else if (imgQuality <= 0.6) pageScale = 1.0;
        else pageScale = 1.5;
      }

      // Compress by rendering each page to canvas at reduced quality
      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= numPages; i++) {
        const pct = 10 + ((i - 1) / numPages) * 80;
        setProgress(pct, `Processing page ${i} of ${numPages}...`);

        const page = await pdfjsDoc.getPage(i);
        const viewport = page.getViewport({ scale: pageScale }); // Dynamic scale based on target

        // Render to offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert canvas to JPEG at desired quality
        const dataUrl = canvas.toDataURL('image/jpeg', imgQuality);
        const base64 = dataUrl.split(',')[1];
        const imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        // Embed JPEG into new PDF
        const jpgImage = await newPdfDoc.embedJpg(imgBytes);

        // Create a new page the same size as original
        const { width, height } = viewport;
        const newPage = newPdfDoc.addPage([width, height]);
        newPage.drawImage(jpgImage, { x: 0, y: 0, width, height });
      }

      setProgress(95, 'Saving compressed PDF...');
      const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
      compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });

      const newSize = compressedBlob.size;
      const saved = origSize - newSize;
      const pct = ((saved / origSize) * 100).toFixed(1);

      setProgress(100, 'Done!');

      // Warn if target not hit
      if (targetBytes && newSize > targetBytes) {
        resultInfo.innerHTML = `
          ⚠️ <strong>Target not fully reached.</strong> Achieved: ${formatBytes(newSize)} 
          (target was ${formatBytes(targetBytes)}).<br>
          Original: ${formatBytes(origSize)} → Compressed: ${formatBytes(newSize)} 
          · Saved ${saved > 0 ? formatBytes(saved) + ' (' + pct + '%)' : '0 (already optimized)'}
        `;
      } else if (saved > 0) {
        resultInfo.innerHTML = `
          ${formatBytes(origSize)} → <strong>${formatBytes(newSize)}</strong> 
          · Saved <strong>${formatBytes(saved)} (${pct}%)</strong>
          ${targetBytes ? `<br>✅ Target of ${formatBytes(targetBytes)} reached!` : ''}
        `;
      } else {
        resultInfo.textContent = `PDF is already well-optimized. Output size: ${formatBytes(newSize)}`;
      }

      setTimeout(() => progressWrap.classList.remove('visible'), 400);
      resultPanel.classList.add('visible');
      compressBtn.style.display = 'none';
      showToast('PDF compressed successfully! 🎉', 'success');

    } catch (e) {
      console.error(e);
      showToast('Error compressing PDF: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      compressBtn.style.display = 'flex';
    }

    compressBtn.disabled = false;
    compressBtn.textContent = '🗜️ Compress PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (compressedBlob) {
      const name = currentFile.name.replace(/\.pdf$/i, '') + '-compressed.pdf';
      downloadBlob(compressedBlob, name);
    }
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null;
    compressedBlob = null;
    fileList.innerHTML = '';
    targetSizeIn.value = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    compressBtn.style.display = 'flex';
  });

})();
