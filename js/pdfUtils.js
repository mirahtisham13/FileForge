// FileForge — Shared PDF Utilities
// Helpers used across multiple tool pages

window.FFUtils = (function () {

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function setupDropZone(dropZoneEl, inputEl, onFiles, opts = {}) {
    const multiple = opts.multiple !== false;
    const accept = opts.accept || '.pdf';

    inputEl.multiple = multiple;
    inputEl.accept = accept;

    dropZoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZoneEl.classList.add('drag-over');
    });
    dropZoneEl.addEventListener('dragleave', () => dropZoneEl.classList.remove('drag-over'));
    dropZoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZoneEl.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    });
    inputEl.addEventListener('change', () => {
      const files = Array.from(inputEl.files);
      if (files.length) onFiles(files);
      inputEl.value = '';
    });
  }

  function buildFileItem(file, onRemove) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.filename = file.name;
    item.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <span class="file-icon">📄</span>
      <span class="file-name" title="${file.name}">${file.name}</span>
      <span class="file-size">${formatBytes(file.size)}</span>
      <button class="file-remove" title="Remove">✕</button>
    `;
    item.querySelector('.file-remove').addEventListener('click', () => {
      item.remove();
      onRemove(file);
    });
    return item;
  }

  function setProgress(fillEl, labelEl, pct, text) {
    if (fillEl) fillEl.style.width = pct + '%';
    if (labelEl) labelEl.querySelector('.pct') && (labelEl.querySelector('.pct').textContent = Math.round(pct) + '%');
    if (text && labelEl) {
      const span = labelEl.querySelector('.msg');
      if (span) span.textContent = text;
    }
  }

  return { formatBytes, readFileAsArrayBuffer, downloadBlob, setupDropZone, buildFileItem, setProgress };
})();
