// FileForge — Crop Image Tool
// Full interactive crop with drag handles, aspect ratio lock, canvas rendering

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let currentFile = null;
  let origImg = null;
  let displayScale = 1; // canvas display scale vs actual image
  let cropRect = { x: 0, y: 0, w: 0, h: 0 }; // in display coords
  let dragState = null; // { type, startX, startY, origRect }
  let aspectRatio = null; // null = free
  let isDrawing = false;

  const dropZone    = document.getElementById('dropZone');
  const fileInput   = document.getElementById('fileInput');
  const actionPanel = document.getElementById('actionPanel');
  const cropCanvas  = document.getElementById('cropCanvas');
  const cropBox     = document.getElementById('cropBox');
  const cropWorkspace = document.getElementById('cropWorkspace');
  const cropInfoBar = document.getElementById('cropInfoBar');
  const cropW_el    = document.getElementById('cropW');
  const cropH_el    = document.getElementById('cropH');
  const cropX_el    = document.getElementById('cropX');
  const cropY_el    = document.getElementById('cropY');
  const cropBtn     = document.getElementById('cropBtn');
  const resetCropBtn= document.getElementById('resetCropBtn');
  const resultPanel = document.getElementById('resultPanel');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn    = document.getElementById('resetBtn');
  const resultInfo  = document.getElementById('resultInfo');
  const cropFormat  = document.getElementById('cropFormat');
  const cropQuality = document.getElementById('cropQuality');

  const ctx = cropCanvas.getContext('2d');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });

  function handleFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    currentFile = f;
    const url = URL.createObjectURL(f);
    origImg = new Image();
    origImg.onload = () => {
      URL.revokeObjectURL(url);
      setupCanvas();
      actionPanel.classList.add('visible');
      resultPanel.classList.remove('visible');
      dropZone.style.display = 'none';
    };
    origImg.src = url;
  }

  function setupCanvas() {
    const maxW = Math.min(origImg.naturalWidth, 800);
    displayScale = maxW / origImg.naturalWidth;
    cropCanvas.width = Math.round(origImg.naturalWidth * displayScale);
    cropCanvas.height = Math.round(origImg.naturalHeight * displayScale);
    drawImage();
    // Default crop: full image minus 10% margin
    const pad = Math.round(Math.min(cropCanvas.width, cropCanvas.height) * 0.1);
    cropRect = { x: pad, y: pad, w: cropCanvas.width - pad * 2, h: cropCanvas.height - pad * 2 };
    updateCropBox();
    updateInfoBar();
  }

  function drawImage() {
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.drawImage(origImg, 0, 0, cropCanvas.width, cropCanvas.height);
  }

  function updateCropBox() {
    const { x, y, w, h } = cropRect;
    if (w < 4 || h < 4) { cropBox.style.display = 'none'; return; }
    cropBox.style.display = 'block';
    cropBox.style.left = (x / cropCanvas.width * 100) + '%';
    cropBox.style.top = (y / cropCanvas.height * 100) + '%';
    cropBox.style.width = (w / cropCanvas.width * 100) + '%';
    cropBox.style.height = (h / cropCanvas.height * 100) + '%';
    cropInfoBar.style.display = 'flex';
    updateInfoBar();
  }

  function updateInfoBar() {
    const realX = Math.round(cropRect.x / displayScale);
    const realY = Math.round(cropRect.y / displayScale);
    const realW = Math.round(cropRect.w / displayScale);
    const realH = Math.round(cropRect.h / displayScale);
    cropW_el.textContent = realW;
    cropH_el.textContent = realH;
    cropX_el.textContent = realX;
    cropY_el.textContent = realY;
  }

  // ── Aspect Ratio ──
  document.querySelectorAll('.aspect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ratio = btn.dataset.ratio;
      if (ratio === 'free') {
        aspectRatio = null;
      } else {
        const [rw, rh] = ratio.split(':').map(Number);
        aspectRatio = rw / rh;
        // Snap current crop box to ratio
        if (cropRect.w > 0 && cropRect.h > 0) {
          const newH = cropRect.w / aspectRatio;
          if (cropRect.y + newH <= cropCanvas.height) {
            cropRect.h = newH;
          } else {
            cropRect.w = cropRect.h * aspectRatio;
          }
          updateCropBox();
        }
      }
    });
  });

  // ── Pointer Events ──
  function getRelPos(e) {
    const rect = cropWorkspace.getBoundingClientRect();
    const scaleX = cropCanvas.width / rect.width;
    const scaleY = cropCanvas.height / rect.height;
    return { 
      x: (e.clientX - rect.left) * scaleX, 
      y: (e.clientY - rect.top) * scaleY 
    };
  }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  // Move crop box
  cropBox.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('crop-handle')) return;
    const pos = getRelPos(e);
    dragState = { type: 'move', startX: pos.x, startY: pos.y, origRect: { ...cropRect } };
    e.preventDefault();
    e.stopPropagation();
  });

  // Resize handles
  cropBox.querySelectorAll('.crop-handle').forEach(handle => {
    handle.addEventListener('pointerdown', (e) => {
      const pos = getRelPos(e);
      const cls = handle.className.split(' ')[1]; // nw, ne, sw, se, n, s, w, e
      dragState = { type: 'resize', handle: cls, startX: pos.x, startY: pos.y, origRect: { ...cropRect } };
      e.preventDefault();
      e.stopPropagation();
    });
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragState) return;
    const pos = getRelPos(e);
    const dx = pos.x - dragState.startX;
    const dy = pos.y - dragState.startY;

    if (dragState.type === 'move') {
      const or = dragState.origRect;
      cropRect.x = clamp(or.x + dx, 0, cropCanvas.width - or.w);
      cropRect.y = clamp(or.y + dy, 0, cropCanvas.height - or.h);
      cropRect.w = or.w;
      cropRect.h = or.h;
    } else if (dragState.type === 'resize') {
      const or = dragState.origRect;
      let { x, y, w, h } = or;
      const h_cls = dragState.handle;
      if (h_cls.includes('e')) w = clamp(or.w + dx, 10, cropCanvas.width - or.x);
      if (h_cls.includes('s')) h = clamp(or.h + dy, 10, cropCanvas.height - or.y);
      if (h_cls.includes('w')) { x = clamp(or.x + dx, 0, or.x + or.w - 10); w = or.w - (x - or.x); }
      if (h_cls.includes('n')) { y = clamp(or.y + dy, 0, or.y + or.h - 10); h = or.h - (y - or.y); }
      if (aspectRatio) { h = w / aspectRatio; }
      cropRect = { x, y, w, h };
    }
    updateCropBox();
  });

  function endDrag() {
    dragState = null;
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // ── Crop & Download ──
  cropBtn.addEventListener('click', async () => {
    if (!origImg || cropRect.w < 2 || cropRect.h < 2) { showToast('Please select a crop area', 'error'); return; }
    const realX = Math.round(cropRect.x / displayScale);
    const realY = Math.round(cropRect.y / displayScale);
    const realW = Math.round(cropRect.w / displayScale);
    const realH = Math.round(cropRect.h / displayScale);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = realW;
    outCanvas.height = realH;
    const outCtx = outCanvas.getContext('2d');
    outCtx.drawImage(origImg, realX, realY, realW, realH, 0, 0, realW, realH);

    const mime = cropFormat.value === 'same' ? (currentFile.type || 'image/jpeg') : cropFormat.value;
    const quality = parseFloat(cropQuality.value);
    const extMap = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' };
    const ext = extMap[mime] || 'jpg';
    const blob = await new Promise(res => outCanvas.toBlob(res, mime, quality));
    const baseName = currentFile.name.replace(/\.[^.]+$/, '');
    downloadBlob(blob, `${baseName}-cropped.${ext}`);
    resultInfo.textContent = `${realW} × ${realH} px · ${formatBytes(blob.size)}`;
    resultPanel.classList.add('visible');
    showToast('Image cropped & downloaded! ✂️', 'success');
  });

  resetCropBtn.addEventListener('click', () => {
    if (!origImg) return;
    setupCanvas();
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; origImg = null;
    cropRect = { x:0,y:0,w:0,h:0 };
    cropBox.style.display = 'none';
    cropInfoBar.style.display = 'none';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    dropZone.style.display = '';
  });

  downloadBtn.addEventListener('click', () => cropBtn.click());

})();
