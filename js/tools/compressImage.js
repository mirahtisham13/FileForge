// FileForge — Compress Image Tool
// Uses Canvas API to re-encode images at lower quality

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let files = [];
  let results = []; // { blob, filename, origSize, newSize }

  const dropZone     = document.getElementById('dropZone');
  const fileInput    = document.getElementById('fileInput');
  const actionPanel  = document.getElementById('actionPanel');
  const qualitySlider= document.getElementById('qualitySlider');
  const qualityVal   = document.getElementById('qualityVal');
  const outputFormat = document.getElementById('outputFormat');
  const imageCards   = document.getElementById('imageCards');
  const resultPanel  = document.getElementById('resultPanel');
  const resultInfo   = document.getElementById('resultInfo');
  const downloadAllBtn= document.getElementById('downloadAllBtn');
  const resetBtn     = document.getElementById('resetBtn');
  const compressBtn  = document.getElementById('compressBtn');

  qualitySlider.addEventListener('input', () => {
    qualityVal.textContent = qualitySlider.value + '%';
  });

  setupDropZone(dropZone, fileInput, handleFiles, {
    multiple: true,
    accept: 'image/jpeg,image/png,image/webp'
  });

  function handleFiles(newFiles) {
    const imgs = newFiles.filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { showToast('Please select image files (JPG, PNG, WEBP)', 'error'); return; }
    imgs.forEach(f => {
      if (!files.find(x => x.name === f.name && x.size === f.size)) files.push(f);
    });
    renderCards();
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    compressBtn.style.display = 'flex';
    results = [];
  }

  function renderCards() {
    imageCards.innerHTML = '';
    files.forEach((f, i) => {
      const url = URL.createObjectURL(f);
      const card = document.createElement('div');
      card.style.cssText = 'margin-bottom:16px;';
      card.innerHTML = `
        <div class="compare-grid" id="card-${i}">
          <div class="compare-card">
            <div class="compare-header">
              <span class="compare-label">Original</span>
              <span class="compare-size">${formatBytes(f.size)}</span>
            </div>
            <div class="compare-img-wrap"><img src="${url}" alt="Original" style="max-height:200px;"/></div>
            <div style="padding:8px 14px;font-size:0.78rem;color:var(--text-3);border-top:1px solid var(--border);">${f.name}</div>
          </div>
          <div class="compare-card">
            <div class="compare-header">
              <span class="compare-label">Compressed</span>
              <span class="compare-size saved" id="new-size-${i}">—</span>
            </div>
            <div class="compare-img-wrap" id="new-img-wrap-${i}">
              <span style="color:var(--text-3);font-size:0.85rem;">Click Compress to see result</span>
            </div>
            <div style="padding:8px 14px;font-size:0.78rem;border-top:1px solid var(--border);" id="saving-${i}"></div>
          </div>
        </div>
      `;
      imageCards.appendChild(card);
    });
  }

  function loadImage(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = rej;
      img.src = url;
    });
  }

  function getOutputMime(file) {
    const sel = outputFormat.value;
    if (sel === 'same') return file.type || 'image/jpeg';
    return sel;
  }

  function getExt(mime) {
    return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'jpg';
  }

  compressBtn.addEventListener('click', async () => {
    if (!files.length) return;
    compressBtn.disabled = true;
    compressBtn.textContent = 'Compressing...';
    results = [];

    const quality = parseInt(qualitySlider.value) / 100;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const img = await loadImage(f);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        const mime = getOutputMime(f);

        // White bg for JPEG
        if (mime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
        const ext = getExt(mime);
        const baseName = f.name.replace(/\.[^.]+$/, '');
        results.push({ blob, filename: `${baseName}-compressed.${ext}`, origSize: f.size, newSize: blob.size });

        // Update card UI
        const newSizeEl = document.getElementById(`new-size-${i}`);
        const newImgWrap = document.getElementById(`new-img-wrap-${i}`);
        const savingEl = document.getElementById(`saving-${i}`);
        const newUrl = URL.createObjectURL(blob);
        const saved = f.size - blob.size;
        const pct = ((saved / f.size) * 100).toFixed(1);

        newSizeEl.textContent = formatBytes(blob.size);
        newImgWrap.innerHTML = `<img src="${newUrl}" alt="Compressed" style="max-height:200px;"/>`;

        if (saved > 0) {
          savingEl.innerHTML = `<span class="saving-badge">↓ ${pct}% saved · ${formatBytes(saved)} smaller</span>`;
        } else {
          savingEl.innerHTML = `<span style="color:var(--text-3);">Already optimized</span>`;
        }
      } catch (e) {
        console.error('Error compressing', f.name, e);
      }
    }

    const totalOrig = results.reduce((s, r) => s + r.origSize, 0);
    const totalNew = results.reduce((s, r) => s + r.newSize, 0);
    const totalSaved = totalOrig - totalNew;
    const totalPct = ((totalSaved / totalOrig) * 100).toFixed(1);
    resultInfo.innerHTML = `${results.length} image${results.length!==1?'s':''} compressed · 
      Total saved: <strong>${formatBytes(totalSaved)}</strong> (${totalPct}%)`;
    resultPanel.classList.add('visible');
    compressBtn.style.display = 'none';
    showToast('Images compressed! 🎉', 'success');

    compressBtn.disabled = false;
    compressBtn.textContent = '🗜️ Compress Images';
  });

  downloadAllBtn.addEventListener('click', async () => {
    if (!results.length) return;
    if (results.length === 1) {
      downloadBlob(results[0].blob, results[0].filename);
      return;
    }
    downloadAllBtn.textContent = '⏳ Zipping...';
    downloadAllBtn.disabled = true;
    const zip = new JSZip();
    results.forEach(r => zip.file(r.filename, r.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'fileforge-compressed-images.zip');
    downloadAllBtn.textContent = '⬇️ Download All';
    downloadAllBtn.disabled = false;
  });

  resetBtn.addEventListener('click', () => {
    files = []; results = [];
    imageCards.innerHTML = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
  });

})();
