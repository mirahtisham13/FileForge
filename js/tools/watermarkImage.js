// FileForge — Add Watermark to Image Tool
// Adds text or image watermark using Canvas API

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let baseImg = null;
  let wmImg = null;
  let baseFile = null;
  let resultBlob = null;
  let currentMode = 'text'; // 'text' or 'image'

  // DOM Elements
  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const previewCanvas  = document.getElementById('previewCanvas');
  const tabText        = document.getElementById('tabText');
  const tabImage       = document.getElementById('tabImage');
  const textOptions    = document.getElementById('textOptions');
  const imageOptions   = document.getElementById('imageOptions');
  
  const wmText         = document.getElementById('wmText');
  const wmFontSize     = document.getElementById('wmFontSize');
  const wmOpacityText  = document.getElementById('wmOpacityText');
  const wmPositionText = document.getElementById('wmPositionText');
  const colorSwatches  = document.querySelectorAll('.color-swatch');
  
  const imgDropZone    = document.getElementById('imgDropZone');
  const imgInput       = document.getElementById('imgInput');
  const wmOpacityImg   = document.getElementById('wmOpacityImg');
  const wmScaleImg     = document.getElementById('wmScaleImg');
  const wmPositionImg  = document.getElementById('wmPositionImg');
  
  const applyBtn       = document.getElementById('applyBtn');
  const resultPanel    = document.getElementById('resultPanel');
  const downloadBtn    = document.getElementById('downloadBtn');
  const resetBtn       = document.getElementById('resetBtn');

  let textColor = '#000000';

  // Initialization
  setupDropZone(dropZone, fileInput, handleBaseFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });
  setupDropZone(imgDropZone, imgInput, handleWmFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });

  // Tabs
  tabText.addEventListener('click', () => setMode('text'));
  tabImage.addEventListener('click', () => setMode('image'));

  function setMode(mode) {
    currentMode = mode;
    tabText.classList.toggle('active', mode === 'text');
    tabImage.classList.toggle('active', mode === 'image');
    textOptions.style.display = mode === 'text' ? 'block' : 'none';
    imageOptions.style.display = mode === 'image' ? 'block' : 'none';
    renderPreview();
  }

  // Load Base Image
  function handleBaseFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    baseFile = f;
    const url = URL.createObjectURL(f);
    baseImg = new Image();
    baseImg.onload = () => {
      URL.revokeObjectURL(url);
      actionPanel.classList.add('visible');
      dropZone.style.display = 'none';
      renderPreview();
    };
    baseImg.src = url;
  }

  // Load Watermark Image
  function handleWmFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f);
    wmImg = new Image();
    wmImg.onload = () => {
      URL.revokeObjectURL(url);
      imgDropZone.querySelector('p').textContent = f.name;
      imgDropZone.querySelector('p').style.color = 'var(--accent)';
      renderPreview();
    };
    wmImg.src = url;
  }

  // Color Swatches
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      textColor = '#' + swatch.dataset.color;
      renderPreview();
    });
  });

  // Re-render bindings
  [wmText, wmFontSize, wmOpacityText, wmPositionText, wmOpacityImg, wmScaleImg, wmPositionImg].forEach(el => {
    el.addEventListener('input', renderPreview);
  });

  function renderPreview() {
    if (!baseImg) return;
    
    // Scale canvas for preview vs export
    const scale = Math.min(1, 800 / baseImg.naturalWidth);
    const w = baseImg.naturalWidth * scale;
    const h = baseImg.naturalHeight * scale;
    
    previewCanvas.width = w;
    previewCanvas.height = h;
    const ctx = previewCanvas.getContext('2d');
    
    drawWatermark(ctx, w, h, true);
  }

  function drawWatermark(ctx, w, h, isPreview) {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseImg, 0, 0, w, h);

    if (currentMode === 'text') {
      const text = wmText.value.trim();
      if (!text) return;
      
      const sizeMult = parseInt(wmFontSize.value);
      // Base font size depends on image height to stay proportional
      const fontSize = Math.max(12, Math.floor(h * (sizeMult / 100)));
      
      ctx.globalAlpha = parseFloat(wmOpacityText.value);
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textBaseline = 'middle';
      
      const pos = wmPositionText.value;
      
      if (pos === 'tiled') {
        const textWidth = ctx.measureText(text).width;
        const padX = textWidth * 1.5;
        const padY = fontSize * 3;
        ctx.translate(w/2, h/2);
        ctx.rotate(-Math.PI / 6);
        ctx.translate(-w, -h); // expand area to cover rotated corners
        for (let y = -h; y < h * 2; y += padY) {
          for (let x = -w; x < w * 2; x += padX) {
            ctx.fillText(text, x, y);
          }
        }
      } else if (pos === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(text, w/2, h/2);
      } else {
        // bottomright
        ctx.textAlign = 'right';
        ctx.fillText(text, w - (fontSize), h - (fontSize));
      }
      
    } else if (currentMode === 'image' && wmImg) {
      ctx.globalAlpha = parseFloat(wmOpacityImg.value);
      const scale = parseFloat(wmScaleImg.value);
      
      const maxDim = Math.min(w, h);
      // Target max width for the watermark based on image scale percentage
      const targetW = maxDim * scale;
      const aspect = wmImg.naturalHeight / wmImg.naturalWidth;
      const dw = targetW;
      const dh = targetW * aspect;
      
      const pos = wmPositionImg.value;
      let dx = 0, dy = 0;
      
      if (pos === 'center') {
        dx = (w - dw) / 2;
        dy = (h - dh) / 2;
      } else if (pos === 'topleft') {
        dx = w * 0.05;
        dy = h * 0.05;
      } else {
        // bottomright
        dx = w - dw - (w * 0.05);
        dy = h - dh - (h * 0.05);
      }
      
      ctx.drawImage(wmImg, dx, dy, dw, dh);
    }
    
    ctx.globalAlpha = 1.0;
  }

  applyBtn.addEventListener('click', async () => {
    if (!baseImg) return;
    if (currentMode === 'image' && !wmImg) {
      showToast('Please upload a watermark image first', 'error');
      return;
    }

    applyBtn.disabled = true;
    applyBtn.textContent = 'Processing...';

    const canvas = document.createElement('canvas');
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw full resolution
    drawWatermark(ctx, canvas.width, canvas.height, false);

    const mime = baseFile.type || 'image/jpeg';
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';

    try {
      resultBlob = await new Promise(res => canvas.toBlob(res, mime, 0.95));
      resultPanel.classList.add('visible');
      applyBtn.style.display = 'none';
      showToast('Watermark applied successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error applying watermark', 'error');
    }

    applyBtn.disabled = false;
    applyBtn.textContent = '💧 Download Watermarked Image';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob && baseFile) {
      const baseName = baseFile.name.replace(/\.[^.]+$/, '');
      const ext = resultBlob.type === 'image/png' ? 'png' : resultBlob.type === 'image/webp' ? 'webp' : 'jpg';
      downloadBlob(resultBlob, `${baseName}-watermarked.${ext}`);
    }
  });

  resetBtn.addEventListener('click', () => {
    baseFile = null;
    baseImg = null;
    wmImg = null;
    resultBlob = null;
    imgDropZone.querySelector('p').textContent = 'Drop watermark image (PNG recommended)';
    imgDropZone.querySelector('p').style.color = '';
    
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    applyBtn.style.display = '';
    dropZone.style.display = '';
  });

})();
