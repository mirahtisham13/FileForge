// FileForge — Sign PDF Tool
// Uses pdf.js for rendering and pdf-lib for stamping the signature

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let pdfLibDoc = null;
  let pdfJsDoc = null;
  let currentPageIndex = 1;
  let totalPages = 1;
  let currentScale = 1;
  let sigImageBlob = null; // Stored signature from canvas

  const dropZone     = document.getElementById('dropZone');
  const fileInput    = document.getElementById('fileInput');
  const actionPanel  = document.getElementById('actionPanel');
  
  const pdfWrapper   = document.getElementById('pdfWrapper');
  const pdfCanvas    = document.getElementById('pdfCanvas');
  const pdfCtx       = pdfCanvas.getContext('2d');
  
  const prevPageBtn  = document.getElementById('prevPageBtn');
  const nextPageBtn  = document.getElementById('nextPageBtn');
  const pageInfo     = document.getElementById('pageInfo');
  
  const sigPad       = document.getElementById('sigPad');
  const sigCtx       = sigPad.getContext('2d');
  const clearSigBtn  = document.getElementById('clearSigBtn');
  const addSigBtn    = document.getElementById('addSigBtn');
  
  const savePdfBtn   = document.getElementById('savePdfBtn');
  const resetBtn     = document.getElementById('resetBtn');

  // Signature Pad Logic
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function initSigPad() {
    sigPad.width = sigPad.offsetWidth * window.devicePixelRatio;
    sigPad.height = sigPad.offsetHeight * window.devicePixelRatio;
    sigCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    sigCtx.lineJoin = 'round';
    sigCtx.lineCap = 'round';
    sigCtx.lineWidth = 3;
    sigCtx.strokeStyle = '#000000';
  }
  window.addEventListener('resize', initSigPad);
  setTimeout(initSigPad, 100);

  function getSigPos(e) {
    const rect = sigPad.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  sigPad.addEventListener('mousedown', (e) => { isDrawing = true; const p = getSigPos(e); lastX = p.x; lastY = p.y; });
  sigPad.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const p = getSigPos(e);
    sigCtx.beginPath(); sigCtx.moveTo(lastX, lastY); sigCtx.lineTo(p.x, p.y); sigCtx.stroke();
    lastX = p.x; lastY = p.y;
  });
  window.addEventListener('mouseup', () => isDrawing = false);

  sigPad.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; const p = getSigPos(e); lastX = p.x; lastY = p.y; }, {passive:false});
  sigPad.addEventListener('touchmove', (e) => {
    e.preventDefault(); if (!isDrawing) return;
    const p = getSigPos(e);
    sigCtx.beginPath(); sigCtx.moveTo(lastX, lastY); sigCtx.lineTo(p.x, p.y); sigCtx.stroke();
    lastX = p.x; lastY = p.y;
  }, {passive:false});
  window.addEventListener('touchend', () => isDrawing = false);

  clearSigBtn.addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigPad.width, sigPad.height);
  });

  // Load PDF
  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    
    currentFile = f;
    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
    
    try {
      const buf = await readFileAsArrayBuffer(f);
      pdfLibDoc = await PDFDocument.load(buf);
      pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      totalPages = pdfJsDoc.numPages;
      currentPageIndex = 1;
      await renderPage(currentPageIndex);
    } catch (e) {
      showToast('Error loading PDF', 'error');
      resetState();
    }
  }

  async function renderPage(num) {
    pageInfo.textContent = `${num} / ${totalPages}`;
    prevPageBtn.disabled = num <= 1;
    nextPageBtn.disabled = num >= totalPages;
    
    const page = await pdfJsDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.5 });
    currentScale = viewport.scale;
    
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    
    await page.render({ canvasContext: pdfCtx, viewport: viewport }).promise;
    
    // Hide signatures that belong to other pages
    document.querySelectorAll('.overlay-sig').forEach(el => {
      if (parseInt(el.dataset.page) === num) el.style.display = 'block';
      else el.style.display = 'none';
    });
  }

  prevPageBtn.addEventListener('click', () => { if (currentPageIndex > 1) renderPage(--currentPageIndex); });
  nextPageBtn.addEventListener('click', () => { if (currentPageIndex < totalPages) renderPage(++currentPageIndex); });

  // Add Signature to viewport
  addSigBtn.addEventListener('click', () => {
    // Check if canvas is empty (basic heuristic)
    const data = sigCtx.getImageData(0,0,sigPad.width,sigPad.height).data;
    let empty = true;
    for(let i=3; i<data.length; i+=4) { if(data[i] !== 0) { empty = false; break; } }
    
    if (empty) { showToast('Please draw a signature first', 'error'); return; }
    
    const dataUrl = sigPad.toDataURL('image/png');
    createOverlay(dataUrl, currentPageIndex);
    showToast('Signature added! Drag to move, use corner to resize.', 'success');
  });

  function createOverlay(src, pageNum) {
    const div = document.createElement('div');
    div.className = 'overlay-sig';
    div.dataset.page = pageNum;
    // Initial size and position
    div.style.left = '50px';
    div.style.top = '50px';
    div.style.width = '200px';
    div.style.height = '100px';
    
    const img = document.createElement('img');
    img.src = src;
    div.appendChild(img);
    
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    div.appendChild(handle);
    
    pdfWrapper.appendChild(div);
    makeDraggableAndResizable(div, handle);
  }

  function makeDraggableAndResizable(el, handle) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startW, startH, startL, startT;

    // Drag
    el.addEventListener('mousedown', (e) => {
      if (e.target === handle) return;
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      startL = parseInt(el.style.left || 0);
      startT = parseInt(el.style.top || 0);
    });
    // Resize
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX; startY = e.clientY;
      startW = parseInt(el.style.width || 0);
      startH = parseInt(el.style.height || 0);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        el.style.left = `${startL + dx}px`;
        el.style.top = `${startT + dy}px`;
      } else if (isResizing) {
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        // maintain aspect ratio roughly
        el.style.width = `${startW + dx}px`;
        el.style.height = `${startH + dy}px`;
      }
    });

    window.addEventListener('mouseup', () => { isDragging = false; isResizing = false; });
  }

  // Save PDF
  savePdfBtn.addEventListener('click', async () => {
    savePdfBtn.disabled = true;
    savePdfBtn.textContent = 'Saving...';
    
    try {
      const overlays = document.querySelectorAll('.overlay-sig');
      
      for (const el of overlays) {
        const pageNum = parseInt(el.dataset.page);
        const imgUrl = el.querySelector('img').src;
        
        // Fetch base64 image and embed
        const res = await fetch(imgUrl);
        const imgBuf = await res.arrayBuffer();
        const pdfImage = await pdfLibDoc.embedPng(imgBuf);
        
        const page = pdfLibDoc.getPage(pageNum - 1);
        const { width: pW, height: pH } = page.getSize();
        
        // Calculate coordinates (CSS coordinates to PDF coordinates)
        // PDF has origin at bottom-left
        const cssL = parseInt(el.style.left || 0);
        const cssT = parseInt(el.style.top || 0);
        const cssW = parseInt(el.style.width || 0);
        const cssH = parseInt(el.style.height || 0);
        
        // Convert to PDF space using the current scale
        const pdfW = cssW / currentScale;
        const pdfH = cssH / currentScale;
        const pdfX = cssL / currentScale;
        // PDF y is from bottom
        const pdfY = pH - (cssT / currentScale) - pdfH;
        
        page.drawImage(pdfImage, {
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH
        });
      }
      
      const bytes = await pdfLibDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const name = currentFile.name.replace('.pdf', '') + '-signed.pdf';
      downloadBlob(blob, name);
      
      showToast('Signed PDF downloaded successfully! 🎉', 'success');
      
    } catch (e) {
      showToast('Error saving PDF', 'error');
    }
    
    savePdfBtn.disabled = false;
    savePdfBtn.textContent = '💾 Save Signed PDF';
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    currentFile = null;
    pdfLibDoc = null;
    pdfJsDoc = null;
    document.querySelectorAll('.overlay-sig').forEach(e => e.remove());
    sigCtx.clearRect(0,0,sigPad.width,sigPad.height);
    
    actionPanel.style.display = 'none';
    dropZone.style.display = '';
  }

})();
