// FileForge — Rotate & Flip Image Tool

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let currentFile = null;
  let origImg = null;
  let rotation = 0; // degrees: 0, 90, 180, 270
  let flipH = false;
  let flipV = false;
  let resultBlob = null;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const previewImg     = document.getElementById('previewImg');
  const btnRotateLeft  = document.getElementById('btnRotateLeft');
  const btnRotateRight = document.getElementById('btnRotateRight');
  const btnFlipH       = document.getElementById('btnFlipH');
  const btnFlipV       = document.getElementById('btnFlipV');
  const applyBtn       = document.getElementById('applyBtn');
  const resultPanel    = document.getElementById('resultPanel');
  const downloadBtn    = document.getElementById('downloadBtn');
  const resetBtn       = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });

  function handleFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    currentFile = f;
    const url = URL.createObjectURL(f);
    
    origImg = new Image();
    origImg.onload = () => {
      URL.revokeObjectURL(url);
      rotation = 0;
      flipH = false;
      flipV = false;
      updatePreview();
      
      actionPanel.classList.add('visible');
      resultPanel.classList.remove('visible');
      applyBtn.style.display = 'flex';
      dropZone.style.display = 'none';
    };
    origImg.src = url;
    previewImg.src = url;
  }

  function updatePreview() {
    let transform = `rotate(${rotation}deg)`;
    if (flipH) transform += ' scaleX(-1)';
    if (flipV) transform += ' scaleY(-1)';
    previewImg.style.transform = transform;
  }

  btnRotateLeft.addEventListener('click', () => {
    rotation = (rotation - 90) % 360;
    updatePreview();
  });

  btnRotateRight.addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    updatePreview();
  });

  btnFlipH.addEventListener('click', () => {
    // If rotated 90 or 270, horizontal flip visually acts like vertical flip on the original image
    if (rotation === 90 || rotation === -270 || rotation === 270 || rotation === -90) {
      flipV = !flipV;
    } else {
      flipH = !flipH;
    }
    updatePreview();
  });

  btnFlipV.addEventListener('click', () => {
    if (rotation === 90 || rotation === -270 || rotation === 270 || rotation === -90) {
      flipH = !flipH;
    } else {
      flipV = !flipV;
    }
    updatePreview();
  });

  applyBtn.addEventListener('click', async () => {
    if (!origImg) return;
    
    applyBtn.disabled = true;
    applyBtn.textContent = 'Processing...';

    // Normalize rotation to positive
    let normRot = rotation % 360;
    if (normRot < 0) normRot += 360;

    const swapDims = normRot === 90 || normRot === 270;
    const w = swapDims ? origImg.naturalHeight : origImg.naturalWidth;
    const h = swapDims ? origImg.naturalWidth : origImg.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Handle center and rotation
    ctx.translate(w / 2, h / 2);
    ctx.rotate((normRot * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(origImg, -origImg.naturalWidth / 2, -origImg.naturalHeight / 2);

    const mime = currentFile.type || 'image/jpeg';
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';

    try {
      resultBlob = await new Promise(res => canvas.toBlob(res, mime, 0.95));
      resultPanel.classList.add('visible');
      applyBtn.style.display = 'none';
      showToast('Image transformed successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error processing image', 'error');
    }

    applyBtn.disabled = false;
    applyBtn.textContent = '🔁 Apply & Download';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob && currentFile) {
      const baseName = currentFile.name.replace(/\.[^.]+$/, '');
      const ext = resultBlob.type === 'image/png' ? 'png' : resultBlob.type === 'image/webp' ? 'webp' : 'jpg';
      downloadBlob(resultBlob, `${baseName}-transformed.${ext}`);
    }
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null;
    origImg = null;
    resultBlob = null;
    previewImg.src = '';
    previewImg.style.transform = 'none';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    dropZone.style.display = '';
  });

})();
