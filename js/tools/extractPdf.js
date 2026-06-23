// FileForge — Extract PDF Pages Tool
// Uses pdf.js to render page previews and extract images.
// Uses pdf-lib to extract selected pages into a new PDF document.

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let pdfJsDoc = null;
  let pdfLibDoc = null;
  let selectedPages = new Set();
  let resultBlob = null;
  let resultFileName = '';

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const pageGrid       = document.getElementById('pageGrid');
  const selectionCount = document.getElementById('selectionCount');
  const btnSelectAll   = document.getElementById('btnSelectAll');
  const btnDeselectAll = document.getElementById('btnDeselectAll');
  
  const outFormat      = document.getElementById('outFormat');
  const imageSettings  = document.getElementById('imageSettings');
  const imgFormat      = document.getElementById('imgFormat');
  const imgScale       = document.getElementById('imgScale');

  const extractBtn     = document.getElementById('extractBtn');
  const progressWrap   = document.getElementById('progressWrap');
  const progressMsg    = document.getElementById('progressMsg');
  const progressPct    = document.getElementById('progressPct');
  const progressFill   = document.getElementById('progressFill');
  const resultPanel    = document.getElementById('resultPanel');
  const resultInfo     = document.getElementById('resultInfo');
  const downloadBtn    = document.getElementById('downloadBtn');
  const resetBtn       = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  // Toggle settings visibility based on output format
  outFormat.addEventListener('change', () => {
    if (outFormat.value === 'image') {
      imageSettings.style.display = 'flex';
      extractBtn.textContent = '🖼️ Extract as Images';
    } else {
      imageSettings.style.display = 'none';
      extractBtn.textContent = '✂️ Extract Selected Pages';
    }
  });

  async function handleFile(files) {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    
    currentFile = f;
    dropZone.style.display = 'none';
    actionPanel.classList.add('visible');
    
    progressWrap.style.display = 'block';
    progressMsg.textContent = 'Loading PDF...';
    
    try {
      const buf = await readFileAsArrayBuffer(f);
      
      // Load with pdf-lib for extraction later
      pdfLibDoc = await PDFDocument.load(buf);
      
      // Load with pdf.js for rendering previews
      pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      
      renderPageThumbnails();
      
    } catch (e) {
      showToast('Error loading PDF: ' + e.message, 'error');
      resetState();
    }
  }

  async function renderPageThumbnails() {
    pageGrid.innerHTML = '';
    selectedPages.clear();
    updateSelectionUI();
    
    progressMsg.textContent = 'Generating previews...';
    
    const numPages = pdfJsDoc.numPages;
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfJsDoc.getPage(i);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      const item = document.createElement('div');
      item.className = 'page-item';
      item.dataset.pageNum = i;
      item.innerHTML = `
        <img src="${imgData}" class="page-item-img" alt="Page ${i}" loading="lazy"/>
        <div class="page-item-num">Page ${i}</div>
        <div class="page-item-check">✓</div>
      `;
      
      item.addEventListener('click', () => togglePage(i, item));
      pageGrid.appendChild(item);
      
      const pct = Math.round((i / numPages) * 100);
      progressPct.textContent = `${pct}%`;
      progressFill.style.width = `${pct}%`;
    }
    
    progressWrap.style.display = 'none';
  }

  function togglePage(pageNum, element) {
    if (selectedPages.has(pageNum)) {
      selectedPages.delete(pageNum);
      element.classList.remove('selected');
    } else {
      selectedPages.add(pageNum);
      element.classList.add('selected');
    }
    updateSelectionUI();
  }

  function updateSelectionUI() {
    selectionCount.textContent = `${selectedPages.size} page${selectedPages.size !== 1 ? 's' : ''} selected`;
    extractBtn.disabled = selectedPages.size === 0;
  }

  btnSelectAll.addEventListener('click', () => {
    selectedPages.clear();
    const numPages = pdfJsDoc.numPages;
    const items = pageGrid.querySelectorAll('.page-item');
    for (let i = 1; i <= numPages; i++) {
      selectedPages.add(i);
      items[i-1].classList.add('selected');
    }
    updateSelectionUI();
  });

  btnDeselectAll.addEventListener('click', () => {
    selectedPages.clear();
    const items = pageGrid.querySelectorAll('.page-item');
    items.forEach(item => item.classList.remove('selected'));
    updateSelectionUI();
  });

  extractBtn.addEventListener('click', async () => {
    if (!pdfLibDoc || selectedPages.size === 0) return;
    
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';
    progressWrap.style.display = 'block';
    
    try {
      const sortedIndices = Array.from(selectedPages).sort((a,b) => a - b);
      
      if (outFormat.value === 'pdf') {
        // Extract as PDF
        progressMsg.textContent = 'Creating new PDF...';
        progressFill.style.width = '50%';
        progressPct.textContent = '50%';

        const newPdf = await PDFDocument.create();
        const indices0 = sortedIndices.map(p => p - 1);
        const copiedPages = await newPdf.copyPages(pdfLibDoc, indices0);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const bytes = await newPdf.save();
        resultBlob = new Blob([bytes], { type: 'application/pdf' });
        resultFileName = currentFile.name.replace('.pdf', '') + '-extracted.pdf';
        
        progressFill.style.width = '100%';
        progressPct.textContent = '100%';
        resultInfo.textContent = `Extracted ${selectedPages.size} pages · ${formatBytes(resultBlob.size)}`;
        downloadBtn.textContent = '⬇️ Download PDF';

      } else {
        // Extract as Images
        const scale = parseFloat(imgScale.value);
        const format = imgFormat.value;
        const ext = format === 'jpeg' ? 'jpg' : 'png';
        const mimeType = 'image/' + format;
        
        let imageBlobs = [];
        
        for (let i = 0; i < sortedIndices.length; i++) {
          const pageNum = sortedIndices[i];
          progressMsg.textContent = `Rendering page ${pageNum} (${i+1} of ${sortedIndices.length})...`;
          const pct = Math.round(((i) / sortedIndices.length) * 100);
          progressFill.style.width = `${pct}%`;
          progressPct.textContent = `${pct}%`;

          const page = await pdfJsDoc.getPage(pageNum);
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
          const blob = await new Promise(res => canvas.toBlob(res, mimeType, 0.92));
          imageBlobs.push({ name: `page-${pageNum}.${ext}`, blob });
        }
        
        progressMsg.textContent = 'Zipping images...';
        progressFill.style.width = '100%';
        progressPct.textContent = '100%';

        if (imageBlobs.length === 1) {
          resultBlob = imageBlobs[0].blob;
          resultFileName = currentFile.name.replace('.pdf', '') + `-page-${sortedIndices[0]}.${ext}`;
          downloadBtn.textContent = '⬇️ Download Image';
        } else {
          const zip = new JSZip();
          imageBlobs.forEach(({ name, blob }) => zip.file(name, blob));
          resultBlob = await zip.generateAsync({ type: 'blob' });
          resultFileName = currentFile.name.replace('.pdf', '') + '-images.zip';
          downloadBtn.textContent = '⬇️ Download All Images (ZIP)';
        }
        
        resultInfo.textContent = `Converted ${selectedPages.size} pages to ${ext.toUpperCase()}`;
      }
      
      setTimeout(() => { progressWrap.style.display = 'none'; }, 400);
      resultPanel.classList.add('visible');
      extractBtn.style.display = 'none';
      pageGrid.style.opacity = '0.5';
      pageGrid.style.pointerEvents = 'none';
      
      showToast('Extraction successful! 🎉', 'success');
      
    } catch (e) {
      console.error(e);
      showToast('Error extracting pages: ' + e.message, 'error');
      progressWrap.style.display = 'none';
    }
    
    extractBtn.disabled = false;
    extractBtn.textContent = outFormat.value === 'image' ? '🖼️ Extract as Images' : '✂️ Extract Selected Pages';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob && resultFileName) {
      downloadBlob(resultBlob, resultFileName);
    }
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    currentFile = null;
    pdfJsDoc = null;
    pdfLibDoc = null;
    resultBlob = null;
    resultFileName = '';
    selectedPages.clear();
    pageGrid.innerHTML = '';
    pageGrid.style.opacity = '1';
    pageGrid.style.pointerEvents = 'all';
    
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    extractBtn.style.display = '';
    dropZone.style.display = '';
    progressWrap.style.display = 'none';
  }

})();
