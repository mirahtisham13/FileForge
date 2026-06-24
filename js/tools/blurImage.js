// FileForge — Blur Sensitive Information Tool
// Uses Canvas API to blur or pixelate selected areas of an image interactively

(function () {
  'use strict';

  const { setupDropZone, downloadBlob } = FFUtils;

  let baseImg = null;
  let baseFile = null;
  let resultBlob = null;
  let isDrawing = false;
  let startX, startY;
  
  // History for Undo
  let history = [];
  
  // Settings
  let currentMode = 'blur'; // 'blur' or 'pixelate'
  
  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const canvasContainer= document.getElementById('canvasContainer');
  const canvas         = document.getElementById('blurCanvas');
  const ctx            = canvas.getContext('2d');
  
  const modeBlur       = document.getElementById('modeBlur');
  const modePixelate   = document.getElementById('modePixelate');
  const intensitySlider= document.getElementById('intensitySlider');
  const undoBtn        = document.getElementById('undoBtn');
  const resetBtn       = document.getElementById('resetBtn');
  const saveBtn        = document.getElementById('saveBtn');
  
  const resultPanel    = document.getElementById('resultPanel');
  const downloadBtn    = document.getElementById('downloadBtn');
  const closeBtn       = document.getElementById('closeBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });

  // Toolbar
  modeBlur.addEventListener('click', () => { currentMode = 'blur'; updateToolbar(); });
  modePixelate.addEventListener('click', () => { currentMode = 'pixelate'; updateToolbar(); });

  function updateToolbar() {
    modeBlur.classList.toggle('active', currentMode === 'blur');
    modePixelate.classList.toggle('active', currentMode === 'pixelate');
  }

  function handleFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    baseFile = f;
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
    saveState();
    
    // Scale canvas CSS for viewing, actual resolution stays high
    let scale = 1;
    const maxW = canvasContainer.clientWidth - 48;
    const maxH = window.innerHeight * 0.6;
    if (canvas.width > maxW || canvas.height > maxH) {
      scale = Math.min(maxW / canvas.width, maxH / canvas.height);
    }
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
    
    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
  }

  function saveState() {
    history.push(canvas.toDataURL());
    if (history.length > 20) history.shift();
  }

  undoBtn.addEventListener('click', () => {
    if (history.length > 1) {
      history.pop(); // remove current state
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0);
      };
      img.src = history[history.length - 1];
    } else {
      showToast('Nothing to undo', 'info');
    }
  });

  resetBtn.addEventListener('click', () => {
    ctx.drawImage(baseImg, 0, 0);
    history = [];
    saveState();
  });

  // Mouse / Touch Events
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', endDraw);
  canvas.addEventListener('touchstart', startDraw, {passive:false});
  canvas.addEventListener('touchmove', draw, {passive:false});
  window.addEventListener('touchend', endDraw);

  let tempCanvas = null;

  function startDraw(e) {
    if(e.type==='touchstart') e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    startX = pos.x;
    startY = pos.y;
    
    // Create a temp copy of current state for previewing the rect
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
  }

  function draw(e) {
    if (!isDrawing) return;
    if(e.type==='touchmove') e.preventDefault();
    
    const pos = getPos(e);
    const w = pos.x - startX;
    const h = pos.y - startY;
    
    // Restore state and draw preview rect
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.8)';
    ctx.lineWidth = 2 * (canvas.width / parseInt(canvas.style.width));
    ctx.strokeRect(startX, startY, w, h);
    ctx.fillStyle = 'rgba(108, 99, 255, 0.1)';
    ctx.fillRect(startX, startY, w, h);
  }

  function endDraw(e) {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Restore from temp (removes the dashed rect)
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    
    const pos = e.type==='touchend' ? getPos(e.changedTouches[0]) : getPos(e);
    let x = Math.min(startX, pos.x);
    let y = Math.min(startY, pos.y);
    let w = Math.abs(pos.x - startX);
    let h = Math.abs(pos.y - startY);
    
    if (w < 10 || h < 10) return; // Too small
    
    applyEffect(x, y, w, h);
    saveState();
  }

  function applyEffect(x, y, w, h) {
    const intensity = parseInt(intensitySlider.value);
    
    // Extract the region
    const region = document.createElement('canvas');
    region.width = w;
    region.height = h;
    const rctx = region.getContext('2d');
    rctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    
    if (currentMode === 'blur') {
      // Use CSS filter for blur
      rctx.filter = `blur(${intensity}px)`;
      rctx.drawImage(region, 0, 0);
      rctx.filter = 'none';
      ctx.drawImage(region, x, y);
    } else {
      // Pixelate
      // Intensity 5-50. Higher intensity = bigger blocks = smaller canvas
      // Let's make the intermediate canvas size w / (intensity / 2).
      const blockScale = Math.max(1, intensity / 2);
      const smW = Math.max(1, Math.ceil(w / blockScale));
      const smH = Math.max(1, Math.ceil(h / blockScale));
      
      const small = document.createElement('canvas');
      small.width = smW;
      small.height = smH;
      const sctx = small.getContext('2d');
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(region, 0, 0, smW, smH);
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, smW, smH, x, y, w, h);
      ctx.imageSmoothingEnabled = true; // restore
    }
  }

  saveBtn.addEventListener('click', () => {
    const mime = baseFile.type || 'image/jpeg';
    resultBlob = null;
    canvas.toBlob(b => {
      resultBlob = b;
      resultPanel.style.display = 'block';
      saveBtn.style.display = 'none';
      canvasContainer.style.opacity = '0.5';
      canvasContainer.style.pointerEvents = 'none';
      showToast('Image saved successfully!', 'success');
    }, mime, 0.95);
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob && baseFile) {
      const baseName = baseFile.name.replace(/\.[^.]+$/, '');
      const ext = resultBlob.type === 'image/png' ? 'png' : resultBlob.type === 'image/webp' ? 'webp' : 'jpg';
      downloadBlob(resultBlob, `${baseName}-secured.${ext}`);
    }
  });

  closeBtn.addEventListener('click', () => {
    baseFile = null;
    baseImg = null;
    resultBlob = null;
    history = [];
    
    actionPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    saveBtn.style.display = '';
    canvasContainer.style.opacity = '1';
    canvasContainer.style.pointerEvents = 'all';
    dropZone.style.display = '';
  });

})();
