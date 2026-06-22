// FileForge — Rearrange PDF Pages
// Uses PDF.js to render thumbnails, pdf-lib to save the reordered PDF

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // State
  let originalFile = null;
  let pdfJsDoc = null;
  let pageOrder = [];      // array of 1-based original page indices
  let selectedPages = new Set();
  let resultBlob = null;

  // Elements
  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const renderProgress = document.getElementById('renderProgress');
  const renderMsg      = document.getElementById('renderMsg');
  const renderPct      = document.getElementById('renderPct');
  const renderFill     = document.getElementById('renderFill');
  const toolbar        = document.getElementById('toolbar');
  const pagesGrid      = document.getElementById('pagesGrid');
  const actionPanel    = document.getElementById('actionPanel');
  const saveBtn        = document.getElementById('saveBtn');
  const saveProgress   = document.getElementById('saveProgress');
  const saveFill       = document.getElementById('saveFill');
  const resultPanel    = document.getElementById('resultPanel');
  const downloadBtn    = document.getElementById('downloadBtn');
  const continueEditBtn= document.getElementById('continueEditBtn');
  const resetBtn       = document.getElementById('resetBtn');
  const resultInfo     = document.getElementById('resultInfo');
  const pageCountBadge = document.getElementById('pageCountBadge');
  const btnReverseAll  = document.getElementById('btnReverseAll');
  const btnSelectAll   = document.getElementById('btnSelectAll');
  const btnDeleteSelected  = document.getElementById('btnDeleteSelected');
  const btnDupSelected     = document.getElementById('btnDupSelected');
  const btnResetOrder      = document.getElementById('btnResetOrder');

  renderProgress.classList.remove('visible');
  saveProgress.classList.remove('visible');

  // ── Setup ──────────────────────────────────────────
  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    originalFile = file;
    resetState();

    renderProgress.style.display = 'block';
    renderMsg.textContent = 'Loading PDF...';
    renderFill.style.width = '5%';
    renderPct.textContent = '5%';

    try {
      const arrayBuf = await file.arrayBuffer();
      pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
      const total = pdfJsDoc.numPages;
      pageOrder = Array.from({ length: total }, (_, i) => i + 1);

      await renderAllThumbnails(total);
      renderProgress.style.display = 'none';
      toolbar.style.display = 'flex';
      actionPanel.classList.add('visible');
      dropZone.style.display = 'none';
      updateBadge();
      showToast(`Loaded ${total} pages — drag to rearrange! ✨`, 'success');
    } catch (e) {
      showToast('Could not read PDF: ' + e.message, 'error');
      renderProgress.style.display = 'none';
    }
  }

  async function renderAllThumbnails(total) {
    pagesGrid.innerHTML = '';
    // Create placeholders first for instant grid layout
    pageOrder.forEach((origIdx, pos) => {
      pagesGrid.appendChild(createThumbSkeleton(origIdx, pos));
    });

    // Render pages progressively
    for (let i = 0; i < total; i++) {
      const pct = Math.round(((i + 1) / total) * 100);
      renderFill.style.width = pct + '%';
      renderPct.textContent = pct + '%';
      renderMsg.textContent = `Rendering page ${i + 1} of ${total}...`;

      const thumb = pagesGrid.querySelector(`[data-pos="${i}"]`);
      if (!thumb) continue;

      try {
        const page = await pdfJsDoc.getPage(pageOrder[i]);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const wrap = thumb.querySelector('.page-canvas-wrap');
        wrap.innerHTML = '';
        wrap.appendChild(canvas);
      } catch { /* page render failed gracefully */ }
    }
  }

  function createThumbSkeleton(origIdx, pos) {
    const wrap = document.createElement('div');
    wrap.className = 'page-thumb';
    wrap.dataset.pos = pos;
    wrap.dataset.origIdx = origIdx;
    wrap.draggable = true;
    wrap.innerHTML = `
      <div class="drop-indicator"></div>
      <div class="page-canvas-wrap"><div class="page-skeleton"></div></div>
      <div class="page-footer">
        <span class="page-num">Page ${pos + 1}</span>
        <div class="page-actions">
          <button class="page-action-btn dup" title="Duplicate page">⧉</button>
          <button class="page-action-btn delete" title="Delete page">🗑</button>
        </div>
      </div>
    `;

    // Select on click
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('.page-action-btn')) return;
      wrap.classList.toggle('selected');
      const pidx = parseInt(wrap.dataset.pos);
      if (wrap.classList.contains('selected')) selectedPages.add(pidx);
      else selectedPages.delete(pidx);
      updateSelectionButtons();
    });

    // Per-page delete
    wrap.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      const pidx = parseInt(wrap.dataset.pos);
      if (pageOrder.length <= 1) { showToast('Cannot delete the only page', 'error'); return; }
      pageOrder.splice(pidx, 1);
      selectedPages.clear();
      rebuildGrid();
    });

    // Per-page duplicate
    wrap.querySelector('.dup').addEventListener('click', (e) => {
      e.stopPropagation();
      const pidx = parseInt(wrap.dataset.pos);
      pageOrder.splice(pidx + 1, 0, pageOrder[pidx]);
      selectedPages.clear();
      rebuildGrid();
    });

    setupDragHandlers(wrap);
    return wrap;
  }

  // ── Drag & Drop ────────────────────────────────────
  let dragSrcPos = null;

  function setupDragHandlers(el) {
    el.addEventListener('dragstart', (e) => {
      dragSrcPos = parseInt(el.dataset.pos);
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragSrcPos);
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      document.querySelectorAll('.page-thumb').forEach(t => {
        t.classList.remove('drop-target', 'show-indicator');
      });
      dragSrcPos = null;
    });

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.page-thumb').forEach(t => t.classList.remove('drop-target'));
      el.classList.add('drop-target');
    });

    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drop-target');
      const destPos = parseInt(el.dataset.pos);
      if (dragSrcPos === null || dragSrcPos === destPos) return;

      // Reorder pageOrder array
      const moved = pageOrder.splice(dragSrcPos, 1)[0];
      const insertAt = dragSrcPos < destPos ? destPos : destPos;
      pageOrder.splice(insertAt, 0, moved);
      selectedPages.clear();
      rebuildGrid();
    });
  }

  // ── Grid Rebuild ───────────────────────────────────
  async function rebuildGrid() {
    pagesGrid.innerHTML = '';
    const total = pageOrder.length;
    const renderPromises = [];

    pageOrder.forEach((origIdx, pos) => {
      const thumb = createThumbSkeleton(origIdx, pos);
      pagesGrid.appendChild(thumb);
      renderPromises.push(renderOneThumbnail(thumb, origIdx, pos));
    });

    updateBadge();
    await Promise.all(renderPromises);
    updateSelectionButtons();
  }

  async function renderOneThumbnail(thumbEl, origIdx, pos) {
    try {
      const page = await pdfJsDoc.getPage(origIdx);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const wrap = thumbEl.querySelector('.page-canvas-wrap');
      wrap.innerHTML = '';
      wrap.appendChild(canvas);
      thumbEl.querySelector('.page-num').textContent = `Page ${pos + 1}`;
    } catch { /* graceful */ }
  }

  // ── Toolbar Actions ────────────────────────────────
  btnReverseAll.addEventListener('click', () => {
    pageOrder.reverse();
    selectedPages.clear();
    rebuildGrid();
    showToast('Pages reversed!');
  });

  btnSelectAll.addEventListener('click', () => {
    const thumbs = pagesGrid.querySelectorAll('.page-thumb');
    const allSelected = selectedPages.size === pageOrder.length;
    selectedPages.clear();
    thumbs.forEach((t, i) => {
      if (!allSelected) { t.classList.add('selected'); selectedPages.add(i); }
      else t.classList.remove('selected');
    });
    updateSelectionButtons();
    btnSelectAll.textContent = allSelected ? '☑ Select All' : '☐ Deselect All';
  });

  btnDeleteSelected.addEventListener('click', () => {
    if (selectedPages.size >= pageOrder.length) { showToast('Cannot delete all pages', 'error'); return; }
    const toDelete = Array.from(selectedPages).sort((a, b) => b - a);
    toDelete.forEach(idx => pageOrder.splice(idx, 1));
    selectedPages.clear();
    rebuildGrid();
    showToast(`Deleted ${toDelete.length} page(s)`);
  });

  btnDupSelected.addEventListener('click', () => {
    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    let offset = 0;
    sorted.forEach(idx => {
      pageOrder.splice(idx + 1 + offset, 0, pageOrder[idx + offset]);
      offset++;
    });
    selectedPages.clear();
    rebuildGrid();
    showToast(`Duplicated ${sorted.length} page(s)`);
  });

  btnResetOrder.addEventListener('click', async () => {
    if (!pdfJsDoc) return;
    pageOrder = Array.from({ length: pdfJsDoc.numPages }, (_, i) => i + 1);
    selectedPages.clear();
    await rebuildGrid();
    showToast('Reset to original order');
  });

  function updateSelectionButtons() {
    const has = selectedPages.size > 0;
    btnDeleteSelected.disabled = !has;
    btnDupSelected.disabled = !has;
  }

  function updateBadge() {
    pageCountBadge.textContent = `${pageOrder.length} page${pageOrder.length !== 1 ? 's' : ''}`;
  }

  // ── Save ───────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    if (!originalFile || !pageOrder.length) return;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    saveProgress.classList.add('visible');
    saveFill.style.width = '0%';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(originalFile);
      const srcPdf = await PDFDocument.load(buf);
      const newPdf = await PDFDocument.create();
      saveFill.style.width = '40%';

      const indices = pageOrder.map(n => n - 1); // convert to 0-based
      const copiedPages = await newPdf.copyPages(srcPdf, indices);
      copiedPages.forEach(p => newPdf.addPage(p));
      saveFill.style.width = '80%';

      const bytes = await newPdf.save();
      saveFill.style.width = '100%';
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      resultInfo.textContent = `${pageOrder.length} pages · ${formatBytes(resultBlob.size)}`;
      saveProgress.classList.remove('visible');
      resultPanel.classList.add('visible');
      saveBtn.style.display = 'none';
      showToast('PDF saved successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error saving PDF: ' + e.message, 'error');
      saveProgress.classList.remove('visible');
      saveBtn.style.display = 'flex';
    }
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Reordered PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const name = (originalFile?.name || 'document').replace('.pdf', '') + '-rearranged.pdf';
      downloadBlob(resultBlob, name);
    }
  });

  continueEditBtn.addEventListener('click', () => {
    resultPanel.classList.remove('visible');
    saveBtn.style.display = 'flex';
  });

  resetBtn.addEventListener('click', () => resetState(true));

  function resetState(showDrop = false) {
    pdfJsDoc = null;
    pageOrder = [];
    selectedPages = new Set();
    resultBlob = null;
    pagesGrid.innerHTML = '';
    toolbar.style.display = 'none';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    saveProgress.classList.remove('visible');
    renderProgress.style.display = 'none';
    if (showDrop) dropZone.style.display = '';
    btnSelectAll.textContent = '☑ Select All';
  }

})();
