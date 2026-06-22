// FileForge — Rotate PDF Tool

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument, degrees } = PDFLib;

  let currentFile = null;
  let totalPages = 0;
  let resultBlob = null;
  let selectedDeg = 90;
  let selectedScope = 'all';

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
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

  // Rotation angle buttons
  document.querySelectorAll('.rotate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rotate-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDeg = parseInt(btn.dataset.deg);
    });
  });

  // Scope buttons
  document.querySelectorAll('.scope-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedScope = btn.dataset.scope;
      rangeInputWrap.style.display = selectedScope === 'range' ? 'flex' : 'none';
    });
  });

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.innerHTML = '';
    fileList.appendChild(buildFileItem(file, () => {
      currentFile = null;
      fileList.innerHTML = '';
      actionPanel.classList.remove('visible');
      pageInfo.textContent = '';
    }));
    try {
      const buf = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(buf);
      totalPages = pdf.getPageCount();
      pageInfo.textContent = `📄 This PDF has ${totalPages} page${totalPages > 1 ? 's' : ''}`;
      actionPanel.classList.add('visible');
      resultPanel.classList.remove('visible');
      rotateBtn.style.display = 'flex';
    } catch {
      showToast('Could not read PDF file', 'error');
    }
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

  rotateBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    rotateBtn.disabled = true;
    rotateBtn.textContent = 'Rotating...';
    progressWrap.classList.add('visible');
    progressFill.style.width = '0%';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const pdfDoc = await PDFDocument.load(buf);
      const pages = pdfDoc.getPages();
      progressFill.style.width = '40%';

      let targetIndices;
      if (selectedScope === 'all') {
        targetIndices = pages.map((_, i) => i);
      } else if (selectedScope === 'odd') {
        targetIndices = pages.map((_, i) => i).filter(i => i % 2 === 0); // 0-indexed: 0,2,4... = pages 1,3,5
      } else if (selectedScope === 'even') {
        targetIndices = pages.map((_, i) => i).filter(i => i % 2 === 1);
      } else {
        targetIndices = parseRange(pageRange.value, totalPages);
        if (!targetIndices.length) { showToast('Enter a valid page range', 'error'); throw new Error('invalid'); }
      }

      targetIndices.forEach(idx => {
        const page = pages[idx];
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + selectedDeg) % 360));
      });

      progressFill.style.width = '80%';
      const bytes = await pdfDoc.save();
      progressFill.style.width = '100%';
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      resultInfo.textContent = `${targetIndices.length} page${targetIndices.length > 1 ? 's' : ''} rotated ${selectedDeg}° · ${formatBytes(resultBlob.size)}`;
      progressWrap.classList.remove('visible');
      resultPanel.classList.add('visible');
      rotateBtn.style.display = 'none';
      showToast('PDF rotated successfully! 🎉', 'success');
    } catch (e) {
      if (e.message !== 'invalid') showToast('Error rotating PDF: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      rotateBtn.style.display = 'flex';
    }
    rotateBtn.disabled = false;
    rotateBtn.textContent = '🔄 Rotate PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const name = currentFile.name.replace('.pdf', '') + '-rotated.pdf';
      downloadBlob(resultBlob, name);
    }
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; resultBlob = null;
    fileList.innerHTML = ''; pageInfo.textContent = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
  });

})();
