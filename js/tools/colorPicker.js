// FileForge — Color Picker Tool
// Extract colors from an image using Canvas API

(function () {
  'use strict';

  const { setupDropZone } = FFUtils;

  const dropZone    = document.getElementById('dropZone');
  const fileInput   = document.getElementById('fileInput');
  const actionPanel = document.getElementById('actionPanel');
  
  const canvasWrap  = document.getElementById('canvasWrap');
  const canvas      = document.getElementById('cpCanvas');
  const ctx         = canvas.getContext('2d', { willReadFrequently: true });
  const magnifier   = document.getElementById('magnifier');
  
  const currentColor= document.getElementById('currentColor');
  const valHex      = document.getElementById('valHex');
  const valRgb      = document.getElementById('valRgb');
  const paletteGrid = document.getElementById('paletteGrid');
  const resetBtn    = document.getElementById('resetBtn');

  let baseImg = null;
  let recentColors = new Set(); // store hex strings
  let isHovering = false;
  
  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: 'image/*' });

  function handleFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    
    const url = URL.createObjectURL(f);
    baseImg = new Image();
    baseImg.onload = () => {
      URL.revokeObjectURL(url);
      initCanvas();
    };
    baseImg.src = url;
  }

  function initCanvas() {
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    ctx.drawImage(baseImg, 0, 0);
    
    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
  }

  function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      cx: clientX - rect.left,
      cy: clientY - rect.top
    };
  }

  function updateColor(pos, saveToPalette = false) {
    // get pixel data
    const x = Math.min(Math.max(0, Math.floor(pos.x)), canvas.width - 1);
    const y = Math.min(Math.max(0, Math.floor(pos.y)), canvas.height - 1);
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    
    const hex = rgbToHex(r, g, b);
    const rgbStr = `rgb(${r}, ${g}, ${b})`;
    
    currentColor.style.background = hex;
    valHex.value = hex;
    valRgb.value = rgbStr;
    
    // update magnifier
    if (isHovering && !saveToPalette) {
      magnifier.style.display = 'block';
      magnifier.style.left = `${pos.cx - 50}px`;
      magnifier.style.top = `${pos.cy - 120}px`; // position above cursor
      
      // We could draw a zoomed version, but a simple color bubble is often better
      magnifier.style.background = hex;
      // Alternatively, draw the actual pixels scaled up:
      // We'll just show the solid color to be fast and clean
    }

    if (saveToPalette) {
      if (!recentColors.has(hex)) {
        recentColors.add(hex);
        if (recentColors.size > 18) {
          const first = recentColors.values().next().value;
          recentColors.delete(first);
        }
        renderPalette();
      }
    }
  }

  function renderPalette() {
    paletteGrid.innerHTML = '';
    [...recentColors].reverse().forEach(hex => {
      const el = document.createElement('div');
      el.className = 'palette-item';
      el.style.background = hex;
      el.title = hex;
      el.onclick = () => {
        currentColor.style.background = hex;
        valHex.value = hex;
        // simplistic rgb parse
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        valRgb.value = `rgb(${r}, ${g}, ${b})`;
      };
      paletteGrid.appendChild(el);
    });
  }

  function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
  }

  canvas.addEventListener('mousemove', (e) => {
    isHovering = true;
    updateColor(getEventPos(e));
  });

  canvas.addEventListener('mouseleave', () => {
    isHovering = false;
    magnifier.style.display = 'none';
  });

  canvas.addEventListener('click', (e) => {
    updateColor(getEventPos(e), true);
    showToast('Color saved to palette', 'info');
  });

  // Touch
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    isHovering = true;
    updateColor(getEventPos(e));
  }, {passive:false});
  
  canvas.addEventListener('touchend', (e) => {
    isHovering = false;
    magnifier.style.display = 'none';
    if (e.changedTouches) {
      updateColor(getEventPos(e.changedTouches[0]), true);
    }
  });

  resetBtn.addEventListener('click', () => {
    baseImg = null;
    actionPanel.style.display = 'none';
    dropZone.style.display = '';
  });

})();
