// FileForge — Resize Image Tool
// Canvas API resize with aspect ratio lock and live preview

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let currentFile = null;
  let origImg = null;
  let aspectRatio = 1;
  let isLocked = true;

  const dropZone      = document.getElementById('dropZone');
  const fileInput     = document.getElementById('fileInput');
  const actionPanel   = document.getElementById('actionPanel');
  const wInput        = document.getElementById('wInput');
  const hInput        = document.getElementById('hInput');
  const lockBtn       = document.getElementById('lockBtn');
  const resizeFormat  = document.getElementById('resizeFormat');
  const origDimInfo   = document.getElementById('origDimInfo');
  const resizePreview = document.getElementById('resizePreview');
  const origImgEl     = document.getElementById('origImg');
  const resizedCanvas = document.getElementById('resizedCanvas');
  const newDimLabel   = document.getElementById('newDimLabel');
  const origDimLabel  = document.getElementById('origDimLabel');
  const resultPanel   = document.getElementById('resultPanel');
  const resultInfo    = document.getElementById('resultInfo');
  const downloadBtn   = document.getElementById('downloadBtn');
  const resetBtn      = document.getElementById('resetBtn');
  const previewBtn    = document.getElementById('previewBtn');
  const resizeBtn     = document.getElementById('resizeBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });

  function handleFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    currentFile = f;
    const url = URL.createObjectURL(f);
    origImg = new Image();
    origImg.onload = () => {
      URL.revokeObjectURL(url);
      aspectRatio = origImg.naturalWidth / origImg.naturalHeight;
      wInput.value = origImg.naturalWidth;
      hInput.value = origImg.naturalHeight;
      origDimInfo.textContent = `Original: ${origImg.naturalWidth} × ${origImg.naturalHeight} px · ${formatBytes(f.size)}`;
      origDimLabel.textContent = `${origImg.naturalWidth} × ${origImg.naturalHeight} · ${formatBytes(f.size)}`;
      origImgEl.src = origImg.src;
      actionPanel.classList.add('visible');
      resultPanel.classList.remove('visible');
    };
    origImg.src = url;
  }

  // Aspect ratio lock
  lockBtn.addEventListener('click', () => {
    isLocked = !isLocked;
    lockBtn.classList.toggle('locked', isLocked);
    lockBtn.title = isLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked';
    lockBtn.textContent = isLocked ? '🔗' : '🔓';
  });

  wInput.addEventListener('input', () => {
    if (isLocked && origImg) {
      hInput.value = Math.round(parseInt(wInput.value || 0) / aspectRatio);
    }
  });

  hInput.addEventListener('input', () => {
    if (isLocked && origImg) {
      wInput.value = Math.round(parseInt(hInput.value || 0) * aspectRatio);
    }
  });

  // Preset buttons
  document.getElementById('presetGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    const pw = parseInt(btn.dataset.w);
    const ph = parseInt(btn.dataset.h);
    wInput.value = pw;
    hInput.value = ph;
    isLocked = false;
    lockBtn.classList.remove('locked');
    lockBtn.textContent = '🔓';
  });

  function getOutputMime() {
    const sel = resizeFormat.value;
    if (sel === 'same') return currentFile?.type || 'image/jpeg';
    return sel;
  }

  function getExt(mime) {
    return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'jpg';
  }

  function doResize(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const mime = getOutputMime();
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(origImg, 0, 0, w, h);
    return { canvas, mime };
  }

  previewBtn.addEventListener('click', () => {
    if (!origImg) return;
    const w = parseInt(wInput.value);
    const h = parseInt(hInput.value);
    if (!w || !h || w < 1 || h < 1) { showToast('Enter valid width and height', 'error'); return; }

    const { canvas } = doResize(w, h);
    // Copy to preview canvas
    resizedCanvas.width = canvas.width;
    resizedCanvas.height = canvas.height;
    const ctx = resizedCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    newDimLabel.textContent = `${w} × ${h} px`;
    resizePreview.style.display = 'grid';
    showToast('Preview updated!');
  });

  resizeBtn.addEventListener('click', async () => {
    if (!origImg || !currentFile) return;
    const w = parseInt(wInput.value);
    const h = parseInt(hInput.value);
    if (!w || !h || w < 1 || h < 1) { showToast('Enter valid width and height', 'error'); return; }

    resizeBtn.disabled = true;
    resizeBtn.textContent = 'Processing...';

    const { canvas, mime } = doResize(w, h);
    const blob = await new Promise(res => canvas.toBlob(res, mime, 0.92));
    const ext = getExt(mime);
    const baseName = currentFile.name.replace(/\.[^.]+$/, '');
    resultInfo.textContent = `${w} × ${h} px · ${formatBytes(blob.size)} (was ${formatBytes(currentFile.size)})`;
    resultPanel.classList.add('visible');

    // Also update preview
    resizedCanvas.width = canvas.width;
    resizedCanvas.height = canvas.height;
    resizedCanvas.getContext('2d').drawImage(canvas, 0, 0);
    newDimLabel.textContent = `${w} × ${h} px · ${formatBytes(blob.size)}`;
    resizePreview.style.display = 'grid';

    downloadBtn._blob = blob;
    downloadBtn._filename = `${baseName}-${w}x${h}.${ext}`;
    showToast('Image resized! 🎉', 'success');

    resizeBtn.disabled = false;
    resizeBtn.textContent = '📐 Download Resized';
  });

  downloadBtn.addEventListener('click', () => {
    if (downloadBtn._blob) downloadBlob(downloadBtn._blob, downloadBtn._filename);
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; origImg = null;
    wInput.value = ''; hInput.value = '';
    origDimInfo.textContent = '';
    resizePreview.style.display = 'none';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    isLocked = true;
    lockBtn.classList.add('locked');
    lockBtn.textContent = '🔗';
  });

})();
