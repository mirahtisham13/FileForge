// FileForge — Add Watermark to PDF
// Text watermark via pdf-lib; live preview via PDF.js + Canvas

(function () {
  'use strict';

  const { setupDropZone, buildFileItem, readFileAsArrayBuffer, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument, rgb, degrees, StandardFonts, PageSizes } = PDFLib;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  let currentFile = null;
  let resultBlob = null;
  let watermarkImage = null; // { dataUrl, arrayBuffer }
  let pdfJsDoc = null;
  let selectedColor = '808080';
  let wmType = 'text';

  // Elements
  const dropZone    = document.getElementById('dropZone');
  const fileInput   = document.getElementById('fileInput');
  const fileList    = document.getElementById('fileList');
  const actionPanel = document.getElementById('actionPanel');
  const applyBtn    = document.getElementById('applyBtn');
  const progressWrap= document.getElementById('progressWrap');
  const progressFill= document.getElementById('progressFill');
  const resultPanel = document.getElementById('resultPanel');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn    = document.getElementById('resetBtn');
  const resultInfo  = document.getElementById('resultInfo');
  const previewWrap = document.getElementById('previewWrap');
  const previewCanvas = document.getElementById('previewCanvas');
  const wmText      = document.getElementById('wmText');
  const wmFontSize  = document.getElementById('wmFontSize');
  const wmOpacity   = document.getElementById('wmOpacity');
  const wmAngle     = document.getElementById('wmAngle');
  const textOptions = document.getElementById('textOptions');
  const imageOptions= document.getElementById('imageOptions');
  const imgDropZone = document.getElementById('imgDropZone');
  const imgInput    = document.getElementById('imgInput');
  const imgOpacity  = document.getElementById('imgOpacity');
  const imgScale    = document.getElementById('imgScale');
  const imgPosition = document.getElementById('imgPosition');

  // ── Tab switching ──
  document.querySelectorAll('.wm-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.wm-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      wmType = tab.dataset.type;
      textOptions.style.display = wmType === 'text' ? 'block' : 'none';
      imageOptions.style.display = wmType === 'image' ? 'block' : 'none';
      if (pdfJsDoc) updatePreview();
    });
  });

  // ── Color swatches ──
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      selectedColor = s.dataset.color;
      if (pdfJsDoc) updatePreview();
    });
  });

  // ── Live preview triggers ──
  [wmText, wmFontSize, wmOpacity, wmAngle, imgOpacity, imgScale, imgPosition].forEach(el => {
    el && el.addEventListener('input', () => { if (pdfJsDoc) updatePreview(); });
    el && el.addEventListener('change', () => { if (pdfJsDoc) updatePreview(); });
  });

  // ── PDF file drop ──
  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const file = files[0];
    if (!file.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    currentFile = file;
    fileList.innerHTML = '';
    fileList.appendChild(buildFileItem(file, () => { currentFile = null; pdfJsDoc = null; fileList.innerHTML = ''; actionPanel.classList.remove('visible'); previewWrap.style.display = 'none'; }));
    const buf = await file.arrayBuffer();
    pdfJsDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    applyBtn.style.display = 'flex';
    await updatePreview();
  }

  // ── Watermark image drop ──
  setupDropZone(imgDropZone, imgInput, async (files) => {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    const dataUrl = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(f); });
    watermarkImage = { dataUrl, arrayBuffer: await f.arrayBuffer(), type: f.type };
    showToast('Watermark image loaded!', 'success');
    if (pdfJsDoc) updatePreview();
  }, { multiple: false, accept: 'image/*' });

  // ── Live Preview via Canvas ──
  async function updatePreview() {
    if (!pdfJsDoc) return;
    previewWrap.style.display = 'block';
    try {
      const page = await pdfJsDoc.getPage(1);
      const scale = 1.2;
      const vp = page.getViewport({ scale });
      previewCanvas.width = vp.width;
      previewCanvas.height = vp.height;
      const ctx = previewCanvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      if (wmType === 'text') {
        const text = wmText.value || 'WATERMARK';
        const fontSize = parseInt(wmFontSize.value) * scale;
        const opacity = parseFloat(wmOpacity.value);
        const angle = parseInt(wmAngle.value);
        const hex = selectedColor;
        const r = parseInt(hex.slice(0,2),16)/255;
        const g = parseInt(hex.slice(2,4),16)/255;
        const b = parseInt(hex.slice(4,6),16)/255;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
        ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(vp.width / 2, vp.height / 2);
        ctx.rotate((angle * Math.PI) / 180);
        // Tiled or single
        const metrics = ctx.measureText(text);
        const tw = metrics.width + 40;
        const th = fontSize + 20;
        for (let y = -vp.height; y < vp.height * 2; y += th * 2.5) {
          for (let x = -vp.width; x < vp.width * 2; x += tw * 1.5) {
            ctx.fillText(text, x, y);
          }
        }
        ctx.restore();
      } else if (wmType === 'image' && watermarkImage) {
        const img = new Image();
        img.src = watermarkImage.dataUrl;
        await new Promise(r => { img.onload = r; });
        const scalePct = parseFloat(imgScale.value);
        const maxW = vp.width * scalePct;
        const ratio = maxW / img.naturalWidth;
        const iw = maxW, ih = img.naturalHeight * ratio;
        const opacity = parseFloat(imgOpacity.value);
        const pos = imgPosition.value;
        const margin = 20;
        let x = (vp.width - iw) / 2, y = (vp.height - ih) / 2;
        if (pos === 'topleft') { x = margin; y = margin; }
        else if (pos === 'topright') { x = vp.width - iw - margin; y = margin; }
        else if (pos === 'bottomleft') { x = margin; y = vp.height - ih - margin; }
        else if (pos === 'bottomright') { x = vp.width - iw - margin; y = vp.height - ih - margin; }
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, x, y, iw, ih);
        ctx.restore();
      }
    } catch (e) { /* preview error ignored */ }
  }

  // ── Apply watermark to all pages ──
  applyBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    if (wmType === 'image' && !watermarkImage) { showToast('Please load a watermark image first', 'error'); return; }

    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying...';
    progressWrap.style.display = 'block';
    progressFill.style.width = '0%';
    resultBlob = null;

    try {
      const buf = await readFileAsArrayBuffer(currentFile);
      const pdfDoc = await PDFDocument.load(buf);
      const pages = pdfDoc.getPages();

      if (wmType === 'text') {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const text = wmText.value || 'WATERMARK';
        const fontSize = parseInt(wmFontSize.value);
        const opacity = parseFloat(wmOpacity.value);
        const angle = parseInt(wmAngle.value);
        const hex = selectedColor;
        const r = parseInt(hex.slice(0,2),16)/255;
        const g = parseInt(hex.slice(2,4),16)/255;
        const b = parseInt(hex.slice(4,6),16)/255;
        const color = rgb(r, g, b);

        pages.forEach((page, i) => {
          const { width, height } = page.getSize();
          const tw = font.widthOfTextAtSize(text, fontSize);
          // Place text tiled diagonally
          const step = Math.max(width, height) * 0.45;
          for (let py = -height; py < height * 2; py += step) {
            for (let px = -width; px < width * 2; px += step) {
              page.drawText(text, {
                x: px, y: py, size: fontSize, font, color,
                opacity, rotate: degrees(angle),
              });
            }
          }
          progressFill.style.width = ((i+1)/pages.length*90) + '%';
        });

      } else if (wmType === 'image' && watermarkImage) {
        let embedFn;
        if (watermarkImage.type === 'image/png') embedFn = pdfDoc.embedPng.bind(pdfDoc);
        else embedFn = pdfDoc.embedJpg.bind(pdfDoc);
        const embImg = await embedFn(watermarkImage.arrayBuffer);
        const scalePct = parseFloat(imgScale.value);
        const opacity = parseFloat(imgOpacity.value);
        const pos = imgPosition.value;

        pages.forEach((page, i) => {
          const { width, height } = page.getSize();
          const iw = width * scalePct;
          const ih = embImg.height * (iw / embImg.width);
          const margin = 20;
          let x = (width - iw) / 2, y = (height - ih) / 2;
          if (pos === 'topleft') { x = margin; y = height - ih - margin; }
          else if (pos === 'topright') { x = width - iw - margin; y = height - ih - margin; }
          else if (pos === 'bottomleft') { x = margin; y = margin; }
          else if (pos === 'bottomright') { x = width - iw - margin; y = margin; }
          page.drawImage(embImg, { x, y, width: iw, height: ih, opacity });
          progressFill.style.width = ((i+1)/pages.length*90) + '%';
        });
      }

      progressFill.style.width = '100%';
      const bytes = await pdfDoc.save();
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      resultInfo.textContent = `${pages.length} page${pages.length!==1?'s':''} watermarked · ${formatBytes(resultBlob.size)}`;
      progressWrap.style.display = 'none';
      resultPanel.classList.add('visible');
      applyBtn.style.display = 'none';
      showToast('Watermark applied! 🎉', 'success');
    } catch (e) {
      showToast('Error applying watermark: ' + e.message, 'error');
      progressWrap.style.display = 'none';
      applyBtn.style.display = 'flex';
    }
    applyBtn.disabled = false;
    applyBtn.textContent = '💧 Apply Watermark';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) downloadBlob(resultBlob, (currentFile?.name || 'doc').replace('.pdf','') + '-watermarked.pdf');
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null; resultBlob = null; pdfJsDoc = null; watermarkImage = null;
    fileList.innerHTML = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    previewWrap.style.display = 'none';
  });

})();
