// FileForge — Merge PDF Tool

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let files = [];
  let mergedBlob = null;

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const actionPanel = document.getElementById('actionPanel');
  const mergeBtn = document.getElementById('mergeBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const resultPanel = document.getElementById('resultPanel');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultInfo = document.getElementById('resultInfo');

  setupDropZone(dropZone, fileInput, handleFiles, { multiple: true, accept: '.pdf' });

  function handleFiles(newFiles) {
    const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfs.length) { showToast('Please select PDF files only', 'error'); return; }
    pdfs.forEach(f => {
      if (!files.find(x => x.name === f.name && x.size === f.size)) {
        files.push(f);
        fileList.appendChild(buildFileItem(f, removeFile));
      }
    });
    updateUI();
    setupDragSort();
  }

  function removeFile(file) {
    files = files.filter(f => f !== file);
    updateUI();
  }

  function updateUI() {
    if (files.length >= 2) {
      actionPanel.classList.add('visible');
      mergeBtn.style.display = 'flex';
      resultPanel.classList.remove('visible');
      progressWrap.classList.remove('visible');
      mergedBlob = null;
    } else {
      actionPanel.classList.remove('visible');
    }
  }

  mergeBtn.addEventListener('click', async () => {
    if (files.length < 2) { showToast('Add at least 2 PDF files to merge', 'error'); return; }
    mergeBtn.disabled = true;
    mergeBtn.textContent = 'Merging...';
    progressWrap.classList.add('visible');
    progressFill.style.width = '0%';
    mergedBlob = null;

    try {
      const merged = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const arrayBuf = await readFileAsArrayBuffer(files[i]);
        const pdf = await PDFDocument.load(arrayBuf);
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => merged.addPage(p));
        const pct = ((i + 1) / files.length) * 90;
        progressFill.style.width = pct + '%';
      }
      progressFill.style.width = '100%';
      const bytes = await merged.save();
      mergedBlob = new Blob([bytes], { type: 'application/pdf' });
      const totalPages = (await PDFDocument.load(await mergedBlob.arrayBuffer())).getPageCount();
      resultInfo.textContent = `${files.length} PDFs merged → ${totalPages} pages · ${formatBytes(mergedBlob.size)}`;
      progressWrap.classList.remove('visible');
      resultPanel.classList.add('visible');
      mergeBtn.style.display = 'none';
      showToast('PDFs merged successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error merging PDFs: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      mergeBtn.style.display = 'flex';
    }
    mergeBtn.disabled = false;
    mergeBtn.textContent = '🔗 Merge PDFs';
  });

  downloadBtn.addEventListener('click', () => {
    if (mergedBlob) downloadBlob(mergedBlob, 'fileforge-merged.pdf');
  });

  resetBtn.addEventListener('click', () => {
    files = [];
    mergedBlob = null;
    fileList.innerHTML = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
  });

  // Drag-to-reorder
  function setupDragSort() {
    let dragging = null;
    fileList.querySelectorAll('.file-item').forEach(item => {
      const handle = item.querySelector('.drag-handle');
      handle.addEventListener('mousedown', () => { item.setAttribute('draggable', 'true'); });
      item.addEventListener('dragstart', () => { dragging = item; item.classList.add('dragging'); });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        item.removeAttribute('draggable');
        dragging = null;
        rebuildFileOrder();
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragging && dragging !== item) {
          const rect = item.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          if (e.clientY < mid) fileList.insertBefore(dragging, item);
          else fileList.insertBefore(dragging, item.nextSibling);
        }
      });
    });
  }

  function rebuildFileOrder() {
    const names = Array.from(fileList.querySelectorAll('.file-item')).map(el => el.dataset.filename);
    files = names.map(n => files.find(f => f.name === n)).filter(Boolean);
  }

})();
