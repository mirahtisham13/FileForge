// FileForge — Convert Image Format Tool

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let files = [];
  let results = [];

  const dropZone      = document.getElementById('dropZone');
  const fileInput     = document.getElementById('fileInput');
  const actionPanel   = document.getElementById('actionPanel');
  const targetFormat  = document.getElementById('targetFormat');
  const convQuality   = document.getElementById('convQuality');
  const formatGrid    = document.getElementById('formatGrid');
  const resultPanel   = document.getElementById('resultPanel');
  const resultInfo    = document.getElementById('resultInfo');
  const downloadAllBtn= document.getElementById('downloadAllBtn');
  const resetBtn      = document.getElementById('resetBtn');
  const convertBtn    = document.getElementById('convertBtn');

  const extMap = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' };
  const nameMap = { 'image/jpeg':'JPG', 'image/png':'PNG', 'image/webp':'WEBP' };
  const badgeMap = { 'image/jpeg':'badge-jpg', 'image/png':'badge-png', 'image/webp':'badge-webp' };

  setupDropZone(dropZone, fileInput, handleFiles, { multiple: true, accept: 'image/jpeg,image/png,image/webp' });

  function handleFiles(newFiles) {
    const imgs = newFiles.filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { showToast('Please select image files', 'error'); return; }
    imgs.forEach(f => { if (!files.find(x => x.name === f.name && x.size === f.size)) files.push(f); });
    renderCards();
    actionPanel.classList.add('visible');
    resultPanel.classList.remove('visible');
    convertBtn.style.display = 'flex';
    results = [];
  }

  function getOrigType(file) {
    return file.type || 'image/jpeg';
  }

  function renderCards() {
    formatGrid.innerHTML = '';
    const toFmt = targetFormat.value;
    files.forEach((f, i) => {
      const srcType = getOrigType(f);
      const srcName = nameMap[srcType] || srcType.split('/')[1].toUpperCase();
      const srcBadge = badgeMap[srcType] || 'badge-jpg';
      const dstName = nameMap[toFmt];
      const dstBadge = badgeMap[toFmt];
      const url = URL.createObjectURL(f);
      const card = document.createElement('div');
      card.className = 'format-card';
      card.id = `fcard-${i}`;
      card.innerHTML = `
        <div class="format-card-header">
          <span class="format-badge ${srcBadge}">${srcName}</span>
          <span class="size-info">${formatBytes(f.size)}</span>
        </div>
        <div class="format-card-img"><img src="${url}" alt="${f.name}" loading="lazy"/></div>
        <div class="convert-arrow">↓ <span style="font-size:0.85rem;vertical-align:middle;">${srcName} → ${dstName}</span></div>
        <div class="format-card-body">
          <span class="format-badge ${dstBadge}" id="dst-badge-${i}">${dstName}</span>
          <span class="size-info" id="dst-size-${i}" style="margin-left:8px;">—</span>
          <span class="saving-tag" id="dst-saving-${i}" style="margin-left:8px;"></span>
        </div>
      `;
      formatGrid.appendChild(card);
    });
  }

  // Re-render when format changes
  targetFormat.addEventListener('change', renderCards);

  function loadImage(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = rej;
      img.src = url;
    });
  }

  convertBtn.addEventListener('click', async () => {
    if (!files.length) return;
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    results = [];

    const toFmt = targetFormat.value;
    const quality = parseFloat(convQuality.value);
    const ext = extMap[toFmt] || 'jpg';

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const img = await loadImage(f);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (toFmt === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise(res => canvas.toBlob(res, toFmt, quality));
        const baseName = f.name.replace(/\.[^.]+$/, '');
        results.push({ blob, filename: `${baseName}.${ext}`, origSize: f.size, newSize: blob.size });

        // Update card UI
        const dstSize = document.getElementById(`dst-size-${i}`);
        const dstSaving = document.getElementById(`dst-saving-${i}`);
        if (dstSize) dstSize.textContent = formatBytes(blob.size);
        if (dstSaving) {
          const diff = f.size - blob.size;
          if (Math.abs(diff) > 100) {
            const sign = diff > 0 ? '↓' : '↑';
            const pct = Math.abs((diff / f.size) * 100).toFixed(1);
            dstSaving.textContent = `${sign} ${pct}%`;
            dstSaving.style.color = diff > 0 ? '#10b981' : '#f59e0b';
          } else {
            dstSaving.textContent = '≈ same size';
          }
        }
      } catch (e) {
        console.error('Conversion error', f.name, e);
      }
    }

    resultInfo.textContent = `${results.length} image${results.length !== 1 ? 's' : ''} converted to ${nameMap[toFmt]}`;
    resultPanel.classList.add('visible');
    convertBtn.style.display = 'none';
    showToast('Images converted! 🎉', 'success');

    convertBtn.disabled = false;
    convertBtn.textContent = '🔄 Convert Images';
  });

  downloadAllBtn.addEventListener('click', async () => {
    if (!results.length) return;
    if (results.length === 1) { downloadBlob(results[0].blob, results[0].filename); return; }
    downloadAllBtn.textContent = '⏳ Zipping...';
    downloadAllBtn.disabled = true;
    const zip = new JSZip();
    results.forEach(r => zip.file(r.filename, r.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'fileforge-converted-images.zip');
    downloadAllBtn.textContent = '⬇️ Download All';
    downloadAllBtn.disabled = false;
  });

  resetBtn.addEventListener('click', () => {
    files = []; results = [];
    formatGrid.innerHTML = '';
    actionPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
  });

})();
