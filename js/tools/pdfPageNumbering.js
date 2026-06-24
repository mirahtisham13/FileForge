// FileForge — PDF Page Numbering Tool
// Uses pdf-lib to embed page numbers at any position on every page.

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument, rgb, StandardFonts } = PDFLib;

  let currentFile = null;
  let resultBlob = null;

  const dropZone    = document.getElementById('dropZone');
  const fileInput   = document.getElementById('fileInput');
  const actionPanel = document.getElementById('actionPanel');

  const positionSel = document.getElementById('position');
  const formatSel   = document.getElementById('format');
  const startNumIn  = document.getElementById('startNum');
  const fontSizeIn  = document.getElementById('fontSize');
  const fontColorSel= document.getElementById('fontColor');
  const marginIn    = document.getElementById('margin');

  const applyBtn    = document.getElementById('applyBtn');
  const progressWrap= document.getElementById('progressWrap');
  const progressMsg = document.getElementById('progressMsg');
  const progressPct = document.getElementById('progressPct');
  const progressFill= document.getElementById('progressFill');
  const resultPanel = document.getElementById('resultPanel');
  const resultInfo  = document.getElementById('resultInfo');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn    = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = f;
    dropZone.style.display = 'none';
    actionPanel.classList.add('visible');
  }

  applyBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    applyBtn.disabled = true;
    progressWrap.style.display = 'block';
    resultPanel.classList.remove('visible');

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const doc = await PDFDocument.load(buf);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;

      const startNum  = Math.max(1, parseInt(startNumIn.value) || 1);
      const fontSize  = Math.max(6, Math.min(36, parseInt(fontSizeIn.value) || 11));
      const margin    = Math.max(8, Math.min(80, parseInt(marginIn.value) || 28));
      const position  = positionSel.value;
      const fmt       = formatSel.value;

      // Parse color
      const colorMap = { black: rgb(0,0,0), gray: rgb(0.4,0.4,0.4), white: rgb(1,1,1) };
      const color = colorMap[fontColorSel.value] || rgb(0,0,0);

      for (let i = 0; i < total; i++) {
        const pageNum = startNum + i;
        let label;
        switch (fmt) {
          case 'page-n':          label = `Page ${pageNum}`; break;
          case 'n-of-total':      label = `${pageNum} / ${startNum + total - 1}`; break;
          case 'page-n-of-total': label = `Page ${pageNum} of ${startNum + total - 1}`; break;
          default:                label = `${pageNum}`;
        }

        const page = pages[i];
        const { width, height } = page.getSize();
        const textW = font.widthOfTextAtSize(label, fontSize);

        // Calculate x, y
        let x, y;
        const isTop = position.startsWith('top');
        const isLeft = position.endsWith('left');
        const isRight = position.endsWith('right');
        const isCenter = position.endsWith('center');

        y = isTop ? (height - margin) : margin;

        if (isLeft)        x = margin;
        else if (isRight)  x = width - margin - textW;
        else               x = (width - textW) / 2; // center

        page.drawText(label, { x, y, size: fontSize, font, color });

        // Progress
        const pct = Math.round(((i + 1) / total) * 100);
        progressMsg.textContent = `Numbering page ${i + 1} of ${total}...`;
        progressPct.textContent = `${pct}%`;
        progressFill.style.width = `${pct}%`;
        // Yield to UI
        await new Promise(r => setTimeout(r, 0));
      }

      const bytes = await doc.save();
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      const outName = currentFile.name.replace(/\.pdf$/i, '') + '-numbered.pdf';
      downloadBtn.onclick = () => downloadBlob(resultBlob, outName);

      progressWrap.style.display = 'none';
      resultPanel.classList.add('visible');
      resultInfo.textContent = `Added page numbers to ${total} pages · ${formatBytes(resultBlob.size)}`;
      showToast('Page numbers added! 🎉', 'success');

    } catch (e) {
      console.error(e);
      showToast('Error: ' + e.message, 'error');
      progressWrap.style.display = 'none';
    }

    applyBtn.disabled = false;
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null;
    resultBlob = null;
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    progressWrap.style.display = 'none';
    dropZone.style.display = '';
    fileInput.value = '';
    progressFill.style.width = '0%';
  });

})();
