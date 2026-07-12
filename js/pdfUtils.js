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
    if (window.trackEvent) {
      window.trackEvent('download_clicked', { filename: filename, page: window.location.pathname });
      window.trackEvent('tool_completed', { page: window.location.pathname });
    }
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

    const trackFiles = (files) => {
      if (files.length > 0 && window.trackEvent) {
        window.trackEvent('file_uploaded', { file_count: files.length, type: accept, page: window.location.pathname });
        window.trackEvent('tool_started', { page: window.location.pathname });
      }
      onFiles(files);
    };

    dropZoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZoneEl.classList.add('drag-over');
    });
    dropZoneEl.addEventListener('dragleave', () => dropZoneEl.classList.remove('drag-over'));
    dropZoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZoneEl.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files);
      if (files.length) trackFiles(files);
    });
    inputEl.addEventListener('change', () => {
      const files = Array.from(inputEl.files);
      if (files.length) trackFiles(files);
      inputEl.value = '';
    });
  }

  function buildFileItem(file, onRemove) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.filename = file.name;
    item.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <span class="file-icon preview-container">📄</span>
      <span class="file-name" title="${file.name}">${file.name}</span>
      <span class="file-size">${formatBytes(file.size)}</span>
      <button class="file-remove" title="Remove" aria-label="Remove file">✕</button>
    `;

    const iconContainer = item.querySelector('.file-icon');
    let objectUrl = null;

    if (file.type.startsWith('image/')) {
      objectUrl = URL.createObjectURL(file);
      iconContainer.innerHTML = `<img class="file-preview-img" src="${objectUrl}" alt="Preview" />`;
    } else if (file.type === 'application/pdf') {
      const renderPdfThumbnail = async () => {
        try {
          if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
              script.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
              };
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          
          objectUrl = URL.createObjectURL(file);
          const loadingTask = pdfjsLib.getDocument(objectUrl);
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = 'file-preview-img';
          
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          iconContainer.innerHTML = '';
          iconContainer.appendChild(canvas);
        } catch (err) {
          console.warn('PDF thumbnail generation failed:', err);
        }
      };
      renderPdfThumbnail();
    }

    item.querySelector('.file-remove').addEventListener('click', () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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
