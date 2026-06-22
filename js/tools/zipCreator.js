// FileForge — ZIP Creator Tool
// Uses JSZip to bundle multiple files into a single ZIP archive

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let selectedFiles = [];
  let resultBlob = null;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const fileList       = document.getElementById('fileList');
  const zipName        = document.getElementById('zipName');
  
  const zipBtn         = document.getElementById('zipBtn');
  const progressWrap   = document.getElementById('progressWrap');
  const progressMsg    = document.getElementById('progressMsg');
  const progressPct    = document.getElementById('progressPct');
  const progressFill   = document.getElementById('progressFill');
  
  const resultPanel    = document.getElementById('resultPanel');
  const resultInfo     = document.getElementById('resultInfo');
  const downloadBtn    = document.getElementById('downloadBtn');
  const resetBtn       = document.getElementById('resetBtn');

  // Allow multiple files via click/drop
  setupDropZone(dropZone, fileInput, handleFiles, { multiple: true });

  function handleFiles(files) {
    if (files.length === 0) return;
    
    // Add to our array
    for (const f of files) {
      // Check if already added
      if (!selectedFiles.find(x => x.name === f.name && x.size === f.size)) {
        selectedFiles.push(f);
      }
    }
    
    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
    
    renderFileList();
  }

  function renderFileList() {
    fileList.innerHTML = '';
    
    if (selectedFiles.length === 0) {
      fileList.innerHTML = `<p style="text-align:center;color:var(--text-3);padding:10px;">No files selected.</p>`;
      zipBtn.disabled = true;
      return;
    }
    
    zipBtn.disabled = false;
    
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.padding = '8px 12px';
      item.style.border = '1px solid var(--border)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.style.marginBottom = '8px';
      item.style.background = 'var(--surface)';
      
      item.innerHTML = `
        <span style="font-size:1.2rem;margin-right:12px;">📄</span>
        <div style="flex:1;overflow:hidden;">
          <div style="font-size:0.85rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${file.name}</div>
          <div style="font-size:0.75rem;color:var(--text-3);">${formatBytes(file.size)}</div>
        </div>
        <button class="remove-btn" style="background:none;border:none;cursor:pointer;color:var(--error);font-size:1.2rem;padding:0 4px;" title="Remove">×</button>
      `;
      
      item.querySelector('.remove-btn').addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        renderFileList();
      });
      
      fileList.appendChild(item);
    });
  }

  zipBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    zipBtn.disabled = true;
    zipBtn.style.display = 'none';
    document.getElementById('addMoreBtn').style.display = 'none';
    
    progressWrap.style.display = 'block';
    progressPct.textContent = '0%';
    progressFill.style.width = '0%';
    progressMsg.textContent = 'Compressing files...';
    
    try {
      const zip = new JSZip();
      
      // Add files to zip
      for (const file of selectedFiles) {
        zip.file(file.name, file);
      }
      
      // Generate ZIP blob
      resultBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 } // Balance speed/size
      }, (metadata) => {
        const pct = Math.round(metadata.percent);
        progressPct.textContent = `${pct}%`;
        progressFill.style.width = `${pct}%`;
        progressMsg.textContent = `Compressing... ${fileList.childElementCount} files`;
      });
      
      progressWrap.style.display = 'none';
      resultPanel.style.display = 'block';
      resultInfo.textContent = `Archive size: ${formatBytes(resultBlob.size)} (Compressed from ${formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))})`;
      
      showToast('ZIP archive created successfully! 🎉', 'success');
      
    } catch (e) {
      showToast('Error creating ZIP: ' + e.message, 'error');
      zipBtn.style.display = '';
      zipBtn.disabled = false;
      progressWrap.style.display = 'none';
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      let name = zipName.value.trim();
      if (!name) name = 'Archive';
      if (!name.endsWith('.zip')) name += '.zip';
      downloadBlob(resultBlob, name);
    }
  });

  resetBtn.addEventListener('click', () => {
    selectedFiles = [];
    resultBlob = null;
    zipName.value = 'Archive';
    
    actionPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    progressWrap.style.display = 'none';
    
    zipBtn.style.display = '';
    document.getElementById('addMoreBtn').style.display = '';
    dropZone.style.display = '';
  });

})();
