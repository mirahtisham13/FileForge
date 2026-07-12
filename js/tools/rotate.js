// FileForge — Rotate PDF Tool
// With Live Grid Preview

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument, degrees } = PDFLib;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  let currentFile = null;
  let totalPages = 0;
  let resultBlob = null;
  let selectedScope = 'all';
  let pdfJsDoc = null;
  let pageRotations = []; // Array to track visual rotations

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const pageGrid = document.getElementById('pageGrid');
  const actionPanel = document.getElementById('actionPanel');
  const rotateBtn = document.getElementById('rotateBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const resultPanel = document.getElementById('resultPanel');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultInfo = document.getElementById('resultInfo');
  const pageInfo = document.getElementById('pageInfo');
  const rangeInputWrap = document.getElementById('rangeInputWrap');
  const pageRange = document.getElementById('pageRange');

  // Scope buttons
  document.querySelectorAll('.scope-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedScope = btn.dataset.scope;
      rangeInputWrap.style.display = selectedScope === 'range' ? 'flex' : 'none';
    });
  });

  // Action buttons to apply rotation to the scope
  document.querySelectorAll('.rotate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const deg = parseInt(btn.dataset.deg);
      applyRotationToScope(deg);
    });
  });

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.style.display = 'none'; // hide standard item
    pageGrid.style.display = 'grid';
    
    try {
      const buf = await readFileAsArrayBuffer(file);
      pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      totalPages = pdfJsDoc.numPages;
      pageRotations = new Array(totalPages).fill(0);
      
      pageInfo.textContent = `📄 This PDF has ${totalPages} page${totalPages > 1 ? 's' : ''}. You can click individual pages to rotate them.`;
      actionPanel.classList.add('visible');
      resultPanel.classList.remove('visible');
      rotateBtn.style.display = 'flex';
      
      await renderPageThumbnails();
    } catch (e) {
      console.error(e);
      showToast('Could not read PDF file', 'error');
    }
  }

  async function renderPageThumbnails() {
    pageGrid.innerHTML = '';
    progressWrap.classList.add('visible');
    const msg = progressWrap.querySelector('.msg');
    const pct = progressWrap.querySelector('.pct');
    msg.textContent = 'Generating previews...';
    
    for (let i = 1; i <= totalPages; i++) {
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
        <div style="overflow:hidden; border-radius:4px; display:flex; align-items:center; justify-content:center; background:var(--surface-2); min-height:140px; margin-bottom:8px;">
          <img src="${imgData}" class="page-item-img" alt="Page ${i}" loading="lazy" style="transition: transform 0.3s ease; max-width:100%; max-height:140px; object-fit:contain;" />
        </div>
        <div class="page-item-num">Page ${i}</div>
        <div class="page-item-check rot-indicator" style="background:rgba(var(--accent-rgb),0.9); color:white; font-size:0.75rem; padding:2px 6px; border-radius:4px; top:12px; right:12px; display:none;">0°</div>
      `;
      
      // Click to rotate individual page
      item.addEventListener('click', () => {
        pageRotations[i-1] = (pageRotations[i-1] + 90) % 360;
        updateVisualRotations();
      });
      
      pageGrid.appendChild(item);
      
      const p = Math.round((i / totalPages) * 100);
      pct.textContent = `${p}%`;
      progressFill.style.width = `${p}%`;
    }
    progressWrap.classList.remove('visible');
    updateVisualRotations();
  }

  function parseRange(str, max) {
    const pages = new Set();
    str.split(',').map(s => s.trim()).forEach(p => {
      if (p.includes('-')) {
        const [a, b] = p.split('-').map(Number);
        for (let i = a; i <= Math.min(b, max); i++) if (i >= 1) pages.add(i - 1);
      } else {
        const n = parseInt(p);
        if (!isNaN(n) && n >= 1 && n <= max) pages.add(n - 1);
      }
    });
    return Array.from(pages);
  }

  function applyRotationToScope(deg) {
    let targetIndices;
    if (selectedScope === 'all') {
      targetIndices = pageRotations.map((_, i) => i);
    } else if (selectedScope === 'odd') {
      targetIndices = pageRotations.map((_, i) => i).filter(i => i % 2 === 0);
    } else if (selectedScope === 'even') {
      targetIndices = pageRotations.map((_, i) => i).filter(i => i % 2 === 1);
    } else {
      targetIndices = parseRange(pageRange.value, totalPages);
      if (!targetIndices.length) { showToast('Enter a valid page range', 'error'); return; }
    }
    
    targetIndices.forEach(idx => {
      // Allow negative degrees too
      pageRotations[idx] = (pageRotations[idx] + deg + 360) % 360;
    });
    updateVisualRotations();
  }

  function updateVisualRotations() {
    const items = pageGrid.querySelectorAll('.page-item');
    items.forEach((item, idx) => {
      const img = item.querySelector('.page-item-img');
      const ind = item.querySelector('.rot-indicator');
      const deg = pageRotations[idx];
      img.style.transform = `rotate(${deg}deg)`;
      
      if (deg !== 0) {
        item.classList.add('selected');
        ind.style.display = 'block';
        ind.textContent = `${deg}°`;
      } else {
        item.classList.remove('selected');
        ind.style.display = 'none';
      }
    });
  }

  rotateBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    
    // Check if any rotations are applied
    const hasRotations = pageRotations.some(r => r !== 0);
    if (!hasRotations) {
      showToast('No rotations applied to any pages.', 'error');
      return;
    }

    rotateBtn.disabled = true;
    rotateBtn.textContent = 'Saving PDF...';
    progressWrap.classList.add('visible');
    progressFill.style.width = '0%';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const pdfDoc = await PDFDocument.load(buf);
      const pages = pdfDoc.getPages();
      progressFill.style.width = '40%';

      let rotatedCount = 0;
      pages.forEach((page, idx) => {
        const rot = pageRotations[idx];
        if (rot !== 0) {
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + rot) % 360));
          rotatedCount++;
        }
      });

      progressFill.style.width = '80%';
      const bytes = await pdfDoc.save();
      progressFill.style.width = '100%';
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      resultInfo.textContent = `${rotatedCount} page${rotatedCount > 1 ? 's' : ''} rotated · ${formatBytes(resultBlob.size)}`;
      
      progressWrap.classList.remove('visible');
      resultPanel.classList.add('visible');
      rotateBtn.style.display = 'none';
      showToast('PDF rotated successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error saving PDF: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      rotateBtn.style.display = 'flex';
    }
    rotateBtn.disabled = false;
    rotateBtn.textContent = '🔄 Save Rotated PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const name = currentFile.name.replace('.pdf', '') + '-rotated.pdf';
      downloadBlob(resultBlob, name);
    }
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; resultBlob = null; pdfJsDoc = null;
    pageRotations = [];
    fileList.style.display = 'flex';
    pageGrid.style.display = 'none';
    pageGrid.innerHTML = ''; 
    pageInfo.textContent = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    rotateBtn.textContent = '🔄 Save Rotated PDF';
  });

})();
