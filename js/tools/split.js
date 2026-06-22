// FileForge — Split PDF Tool

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument } = PDFLib;

  let currentFile = null;
  let totalPages = 0;
  let splitBlobs = [];

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const actionPanel = document.getElementById('actionPanel');
  const splitBtn = document.getElementById('splitBtn');
  const splitMode = document.getElementById('splitMode');
  const rangeGroup = document.getElementById('rangeGroup');
  const pageRange = document.getElementById('pageRange');
  const pageInfo = document.getElementById('pageInfo');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const resultPanel = document.getElementById('resultPanel');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultInfo = document.getElementById('resultInfo');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  splitMode.addEventListener('change', () => {
    rangeGroup.style.display = splitMode.value === 'range' ? 'flex' : 'none';
  });

  async function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.innerHTML = '';
    fileList.appendChild(buildFileItem(file, () => { currentFile = null; fileList.innerHTML = ''; actionPanel.classList.remove('visible'); }));

    try {
      const buf = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(buf);
      totalPages = pdf.getPageCount();
      pageInfo.textContent = `📄 This PDF has ${totalPages} page${totalPages > 1 ? 's' : ''}`;
      actionPanel.classList.add('visible');
      resultPanel.classList.remove('visible');
      splitBtn.style.display = 'flex';
    } catch {
      showToast('Could not read PDF file', 'error');
    }
  }

  function parseRange(str, max) {
    const pages = new Set();
    const parts = str.split(',').map(s => s.trim());
    for (const p of parts) {
      if (p.includes('-')) {
        const [a, b] = p.split('-').map(Number);
        for (let i = a; i <= Math.min(b, max); i++) if (i >= 1) pages.add(i);
      } else {
        const n = parseInt(p);
        if (!isNaN(n) && n >= 1 && n <= max) pages.add(n);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  }

  splitBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    splitBtn.disabled = true;
    splitBtn.textContent = 'Splitting...';
    progressWrap.classList.add('visible');
    progressFill.style.width = '0%';
    splitBlobs = [];

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const srcPdf = await PDFDocument.load(buf);

      if (splitMode.value === 'all') {
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(srcPdf, [i]);
          newPdf.addPage(page);
          const bytes = await newPdf.save();
          splitBlobs.push({ name: `page-${i + 1}.pdf`, blob: new Blob([bytes], { type: 'application/pdf' }) });
          progressFill.style.width = ((i + 1) / totalPages * 100) + '%';
        }
        resultInfo.textContent = `Split into ${totalPages} individual pages.`;
      } else {
        const pages = parseRange(pageRange.value, totalPages);
        if (!pages.length) { showToast('Enter a valid page range', 'error'); throw new Error('invalid range'); }
        const newPdf = await PDFDocument.create();
        const copied = await newPdf.copyPages(srcPdf, pages.map(p => p - 1));
        copied.forEach(p => newPdf.addPage(p));
        const bytes = await newPdf.save();
        splitBlobs.push({ name: `extracted-pages.pdf`, blob: new Blob([bytes], { type: 'application/pdf' }) });
        progressFill.style.width = '100%';
        resultInfo.textContent = `Extracted ${pages.length} page(s) → ${formatBytes(bytes.length)}`;
      }

      progressWrap.classList.remove('visible');
      resultPanel.classList.add('visible');
      splitBtn.style.display = 'none';
      showToast('PDF split successfully! 🎉', 'success');
    } catch (e) {
      if (e.message !== 'invalid range') showToast('Error splitting PDF: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      splitBtn.style.display = 'flex';
    }
    splitBtn.disabled = false;
    splitBtn.textContent = '✂️ Split PDF';
  });

  downloadBtn.addEventListener('click', async () => {
    if (!splitBlobs.length) return;
    if (splitBlobs.length === 1) {
      downloadBlob(splitBlobs[0].blob, splitBlobs[0].name);
    } else {
      const zip = new JSZip();
      splitBlobs.forEach(({ name, blob }) => zip.file(name, blob));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'fileforge-split-pages.zip');
    }
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; splitBlobs = [];
    fileList.innerHTML = ''; pageInfo.textContent = '';
    actionPanel.classList.remove('visible'); resultPanel.classList.remove('visible');
  });

})();
