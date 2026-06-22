// FileForge — PDF to Images Tool
// Uses PDF.js to render each page to canvas, then exports as JPG/PNG

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, downloadBlob, formatBytes } = FFUtils;

  // Configure PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  let currentFile = null;
  let imageBlobs = [];

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const actionPanel = document.getElementById('actionPanel');
  const convertBtn = document.getElementById('convertBtn');
  const imgFormat = document.getElementById('imgFormat');
  const imgScale = document.getElementById('imgScale');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressMsg = progressWrap.querySelector('.msg');
  const progressPct = progressWrap.querySelector('.pct');
  const previewGrid = document.getElementById('previewGrid');
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
    previewGrid.innerHTML = '';
    fileList.appendChild(buildFileItem(file, () => {
      currentFile = null;
      fileList.innerHTML = '';
      previewGrid.innerHTML = '';
      actionPanel.classList.remove('visible');
    }));
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    convertBtn.style.display = 'flex';
  }

  convertBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    progressWrap.classList.add('visible');
    progressFill.style.width = '0%';
    previewGrid.innerHTML = '';
    imageBlobs = [];

    try {
      const arrayBuf = await currentFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
      const totalPages = pdfDoc.numPages;
      const scale = parseFloat(imgScale.value);
      const format = imgFormat.value;
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const mimeType = 'image/' + format;

      for (let i = 1; i <= totalPages; i++) {
        progressMsg.textContent = `Rendering page ${i} of ${totalPages}...`;
        const pct = ((i - 1) / totalPages) * 100;
        progressFill.style.width = pct + '%';
        progressPct.textContent = Math.round(pct) + '%';

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        // White background for JPG
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Preview thumbnail
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'preview-thumb';
        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        const maxThumbW = 200;
        const ratio = maxThumbW / canvas.width;
        thumbCanvas.width = maxThumbW;
        thumbCanvas.height = canvas.height * ratio;
        thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        const label = document.createElement('div');
        label.className = 'preview-label';
        label.textContent = `Page ${i}`;
        thumbWrap.appendChild(thumbCanvas);
        thumbWrap.appendChild(label);
        previewGrid.appendChild(thumbWrap);

        // Collect blob
        const blob = await new Promise(res => canvas.toBlob(res, mimeType, 0.92));
        imageBlobs.push({ name: `page-${i}.${ext}`, blob });
      }

      progressFill.style.width = '100%';
      progressPct.textContent = '100%';
      progressMsg.textContent = 'Done!';

      resultInfo.textContent = `${totalPages} page${totalPages > 1 ? 's' : ''} converted to ${ext.toUpperCase()}`;
      progressWrap.classList.remove('visible');
      resultPanel.classList.add('visible');
      convertBtn.style.display = 'none';
      showToast('Pages converted successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error converting PDF: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      convertBtn.style.display = 'flex';
    }
    convertBtn.disabled = false;
    convertBtn.textContent = '🖼️ Convert to Images';
  });

  downloadBtn.addEventListener('click', async () => {
    if (!imageBlobs.length) return;
    if (imageBlobs.length === 1) {
      downloadBlob(imageBlobs[0].blob, imageBlobs[0].name);
      return;
    }
    downloadBtn.textContent = '⏳ Zipping...';
    downloadBtn.disabled = true;
    const zip = new JSZip();
    imageBlobs.forEach(({ name, blob }) => zip.file(name, blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'fileforge-pdf-images.zip');
    downloadBtn.textContent = '⬇️ Download All Images (ZIP)';
    downloadBtn.disabled = false;
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; imageBlobs = [];
    fileList.innerHTML = ''; previewGrid.innerHTML = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
  });

})();
