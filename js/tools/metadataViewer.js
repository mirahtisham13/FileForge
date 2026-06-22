// FileForge — Metadata Viewer
// Uses exifr to extract EXIF data from images and shows basic metadata for other files

(function () {
  'use strict';

  const { setupDropZone, formatBytes } = FFUtils;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const resultsArea    = document.getElementById('resultsArea');
  const resetBtn       = document.getElementById('resetBtn');
  
  const previewArea    = document.getElementById('previewArea');
  const previewFallback= document.getElementById('previewFallback');
  
  const ovName         = document.getElementById('ovName');
  const ovSize         = document.getElementById('ovSize');
  const ovType         = document.getElementById('ovType');
  const ovModified     = document.getElementById('ovModified');
  
  const exifTableWrap  = document.getElementById('exifTableWrap');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false });

  function handleFile(files) {
    const f = files[0];
    if (!f) return;
    
    dropZone.style.display = 'none';
    resultsArea.style.display = 'block';
    
    // Overview
    ovName.textContent = f.name;
    ovSize.textContent = formatBytes(f.size);
    ovType.textContent = f.type || 'Unknown';
    ovModified.textContent = new Date(f.lastModified).toLocaleString();

    // Preview
    previewArea.innerHTML = '';
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.onload = () => URL.revokeObjectURL(url);
      img.src = url;
      previewArea.appendChild(img);
      extractExif(f);
    } else {
      previewArea.innerHTML = `<span class="icon-fallback">📄</span>`;
      exifTableWrap.innerHTML = `<div class="empty-state">EXIF data is only available for images (JPG, PNG, HEIC, etc.)</div>`;
    }
  }

  async function extractExif(file) {
    try {
      exifTableWrap.innerHTML = `<div class="empty-state">Loading EXIF data...</div>`;
      
      // exifr parses EXIF data extremely fast
      const exifData = await exifr.parse(file, {
        tiff: true, ifd0: true, ifd1: true, exif: true, gps: true
      });
      
      if (!exifData || Object.keys(exifData).length === 0) {
        exifTableWrap.innerHTML = `<div class="empty-state">No EXIF or hidden metadata found in this image.</div>`;
        return;
      }
      
      let html = `<table class="meta-table"><tbody>`;
      
      // Sort keys alphabetically
      const keys = Object.keys(exifData).sort();
      keys.forEach(k => {
        let val = exifData[k];
        if (val instanceof Uint8Array || val instanceof ArrayBuffer) {
          val = '[Binary Data]';
        } else if (Array.isArray(val)) {
          val = val.join(', ');
        } else if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        
        html += `<tr><td>${k}</td><td>${val}</td></tr>`;
      });
      
      html += `</tbody></table>`;
      exifTableWrap.innerHTML = html;
      
    } catch (e) {
      exifTableWrap.innerHTML = `<div class="empty-state">Could not read metadata. The file may be corrupted or in an unsupported format.</div>`;
    }
  }

  resetBtn.addEventListener('click', () => {
    resultsArea.style.display = 'none';
    dropZone.style.display = '';
  });

})();
