// FileForge — Extract PDF Pages Tool
// Uses pdf.js to render page previews and pdf-lib to extract selected pages into a new document

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let pdfJsDoc = null;
  let pdfLibDoc = null;
  let selectedPages = new Set();
  let resultBlob = null;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const pageGrid       = document.getElementById('pageGrid');
  const selectionCount = document.getElementById('selectionCount');
  const btnSelectAll   = document.getElementById('btnSelectAll');
  const btnDeselectAll = document.getElementById('btnDeselectAll');
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
    
    try {
      const newPdf = await PDFDocument.create();
      
      // pdf-lib indices are 0-based, our UI is 1-based
      const sortedIndices = Array.from(selectedPages).map(p => p - 1).sort((a,b) => a - b);
      
      const copiedPages = await newPdf.copyPages(pdfLibDoc, sortedIndices);
      copiedPages.forEach(page => newPdf.addPage(page));
      
      const bytes = await newPdf.save();
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      
      resultInfo.textContent = `Extracted ${selectedPages.size} pages · ${formatBytes(resultBlob.size)}`;
      resultPanel.classList.add('visible');
      extractBtn.style.display = 'none';
      pageGrid.style.opacity = '0.5';
      pageGrid.style.pointerEvents = 'none';
      
      showToast('Pages extracted successfully! 🎉', 'success');
      
    } catch (e) {
      showToast('Error extracting pages', 'error');
    }
    
    extractBtn.disabled = false;
    extractBtn.textContent = '✂️ Extract Selected Pages';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob && currentFile) {
      const name = currentFile.name.replace('.pdf', '') + '-extracted.pdf';
      downloadBlob(resultBlob, name);
    }
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    currentFile = null;
    pdfJsDoc = null;
    pdfLibDoc = null;
    resultBlob = null;
    selectedPages.clear();
    pageGrid.innerHTML = '';
    pageGrid.style.opacity = '1';
    pageGrid.style.pointerEvents = 'all';
    
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    extractBtn.style.display = '';
    dropZone.style.display = '';
  }

})();
