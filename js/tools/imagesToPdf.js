// FileForge — Images to PDF Tool

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;
  const { PDFDocument, PageSizes } = PDFLib;

  let files = [];
  let resultBlob = null;

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const previewGrid = document.getElementById('previewGrid');
  const actionPanel = document.getElementById('actionPanel');
  const convertBtn = document.getElementById('convertBtn');
  const pageSizeSelect = document.getElementById('pageSize');
  const orientationSelect = document.getElementById('orientation');
  const marginSelect = document.getElementById('margin');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressMsg = progressWrap.querySelector('.msg');
  const progressPct = progressWrap.querySelector('.pct');
  const resultPanel = document.getElementById('resultPanel');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultInfo = document.getElementById('resultInfo');

  setupDropZone(dropZone, fileInput, handleFiles, {
    multiple: true,
    accept: 'image/jpeg,image/png,image/webp'
  });

  function handleFiles(newFiles) {
    const imgs = newFiles.filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { showToast('Please select image files', 'error'); return; }
    imgs.forEach(f => {
      if (!files.find(x => x.name === f.name && x.size === f.size)) {
        files.push(f);
        previewGrid.appendChild(buildThumb(f));
      }
    });
    updateUI();
    setupDragSort();
  }

  function buildThumb(file) {
    const wrap = document.createElement('div');
    wrap.className = 'img-thumb-wrap';
    wrap.dataset.filename = file.name;
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    const label = document.createElement('div');
    label.className = 'img-thumb-label';
    label.innerHTML = `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px">${file.name}</span>
      <button class="img-thumb-remove" title="Remove">✕</button>`;
    label.querySelector('.img-thumb-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      files = files.filter(f => f !== file);
      URL.revokeObjectURL(img.src);
      wrap.remove();
      updateUI();
    });
    wrap.appendChild(img);
    wrap.appendChild(label);
    return wrap;
  }

  function updateUI() {
    if (files.length > 0) {
      actionPanel.classList.add('visible');
      convertBtn.style.display = 'flex';
      resultPanel.classList.remove('visible');
      resultBlob = null;
    } else {
      actionPanel.classList.remove('visible');
    }
  }

  function loadImageAsDataURL(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  function getImageDimensions(dataUrl) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUrl;
    });
  }

  convertBtn.addEventListener('click', async () => {
    if (!files.length) return;

    // Rebuild order from DOM
    const order = Array.from(previewGrid.querySelectorAll('.img-thumb-wrap')).map(el => el.dataset.filename);
    files = order.map(n => files.find(f => f.name === n)).filter(Boolean);

    convertBtn.disabled = true;
    convertBtn.textContent = 'Creating PDF...';
    progressWrap.classList.add('visible');
    progressFill.style.width = '0%';
    resultBlob = null;

    try {
      const pdfDoc = await PDFDocument.create();
      const margin = parseInt(marginSelect.value);
      const orientation = orientationSelect.value;

      // Preset page sizes in points (1pt = 1/72 inch)
      const A4 = [595.28, 841.89];
      const LETTER = [612, 792];

      for (let i = 0; i < files.length; i++) {
        progressMsg.textContent = `Adding image ${i + 1} of ${files.length}...`;
        const pct = (i / files.length) * 95;
        progressFill.style.width = pct + '%';
        progressPct.textContent = Math.round(pct) + '%';

        const dataUrl = await loadImageAsDataURL(files[i]);
        const { w, h } = await getImageDimensions(dataUrl);

        let embedFn, imgBytes;
        const type = files[i].type;
        if (type === 'image/png') {
          imgBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
          embedFn = pdfDoc.embedPng.bind(pdfDoc);
        } else {
          imgBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
          embedFn = pdfDoc.embedJpg.bind(pdfDoc);
        }
        const embeddedImg = await embedFn(imgBytes);

        let pageW, pageH;
        if (pageSizeSelect.value === 'fit') {
          pageW = w; pageH = h;
        } else if (pageSizeSelect.value === 'a4') {
          [pageW, pageH] = orientation === 'landscape' ? [A4[1], A4[0]] : A4;
        } else {
          [pageW, pageH] = orientation === 'landscape' ? [LETTER[1], LETTER[0]] : LETTER;
        }

        const page = pdfDoc.addPage([pageW, pageH]);
        const drawW = pageW - margin * 2;
        const drawH = pageH - margin * 2;
        const scale = Math.min(drawW / w, drawH / h);
        const scaledW = w * scale;
        const scaledH = h * scale;
        const x = margin + (drawW - scaledW) / 2;
        const y = margin + (drawH - scaledH) / 2;
        page.drawImage(embeddedImg, { x, y, width: scaledW, height: scaledH });
      }

      progressFill.style.width = '100%';
      progressPct.textContent = '100%';
      const bytes = await pdfDoc.save();
      resultBlob = new Blob([bytes], { type: 'application/pdf' });
      resultInfo.textContent = `${files.length} image${files.length > 1 ? 's' : ''} → PDF · ${formatBytes(resultBlob.size)}`;
      progressWrap.classList.remove('visible');
      resultPanel.classList.add('visible');
      convertBtn.style.display = 'none';
      showToast('PDF created successfully! 🎉', 'success');
    } catch (e) {
      showToast('Error creating PDF: ' + e.message, 'error');
      progressWrap.classList.remove('visible');
      convertBtn.style.display = 'flex';
    }
    convertBtn.disabled = false;
    convertBtn.textContent = '📄 Create PDF';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) downloadBlob(resultBlob, 'fileforge-images.pdf');
  });

  resetBtn.addEventListener('click', () => {
    files = []; resultBlob = null;
    previewGrid.querySelectorAll('img').forEach(img => URL.revokeObjectURL(img.src));
    previewGrid.innerHTML = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
  });

  // Drag-to-reorder
  function setupDragSort() {
    let dragging = null;
    previewGrid.querySelectorAll('.img-thumb-wrap').forEach(item => {
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', () => { dragging = item; item.classList.add('dragging'); });
      item.addEventListener('dragend', () => { item.classList.remove('dragging'); dragging = null; });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragging && dragging !== item) {
          const rect = item.getBoundingClientRect();
          if (e.clientX < rect.left + rect.width / 2) previewGrid.insertBefore(dragging, item);
          else previewGrid.insertBefore(dragging, item.nextSibling);
        }
      });
    });
  }

})();
