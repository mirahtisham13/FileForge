// FileForge — Merge Text Files Tool

(function () {
  'use strict';

  const { setupDropZone, downloadBlob, formatBytes } = FFUtils;

  let selectedFiles = [];
  let resultBlob = null;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const fileList       = document.getElementById('fileList');
  const separatorSel   = document.getElementById('separator');
  const mergeBtn       = document.getElementById('mergeBtn');
  
  const resultPanel    = document.getElementById('resultPanel');
  const resultInfo     = document.getElementById('resultInfo');
  const downloadBtn    = document.getElementById('downloadBtn');
  const resetBtn       = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFiles, { multiple: true });

  function handleFiles(files) {
    if (files.length === 0) return;
    
    for (const f of files) {
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
      mergeBtn.disabled = true;
      return;
    }
    
    mergeBtn.disabled = false;
    
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

  mergeBtn.addEventListener('click', async () => {
    if (selectedFiles.length < 2) {
      showToast('Please select at least 2 files to merge', 'error');
      return;
    }
    
    mergeBtn.disabled = true;
    mergeBtn.textContent = 'Merging...';
    
    try {
      let combinedText = '';
      const sepType = separatorSel.value;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const text = await file.text();
        
        let prefix = '';
        if (i > 0) {
          if (sepType === 'newline') prefix = '\n';
          else if (sepType === 'double_newline') prefix = '\n\n';
          else if (sepType === 'divider') prefix = '\n\n----------------------------------------\n\n';
          else if (sepType === 'filename') prefix = `\n\n--- ${file.name} ---\n\n`;
        } else if (sepType === 'filename') {
          prefix = `--- ${file.name} ---\n\n`;
        }
        
        combinedText += prefix + text;
      }
      
      resultBlob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
      
      resultPanel.style.display = 'block';
      mergeBtn.style.display = 'none';
      document.getElementById('addMoreBtn').style.display = 'none';
      separatorSel.parentElement.style.display = 'none';
      
      resultInfo.textContent = `Merged ${selectedFiles.length} files (${formatBytes(resultBlob.size)})`;
      showToast('Files merged successfully!', 'success');
      
    } catch (e) {
      showToast('Error merging files: ' + e.message, 'error');
    }
    
    mergeBtn.disabled = false;
    mergeBtn.textContent = '📑 Merge Files';
  });

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      // Use extension of the first file, default to txt
      const extMatch = selectedFiles[0].name.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0] : '.txt';
      downloadBlob(resultBlob, `merged_document${ext}`);
    }
  });

  resetBtn.addEventListener('click', () => {
    selectedFiles = [];
    resultBlob = null;
    
    actionPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    mergeBtn.style.display = '';
    document.getElementById('addMoreBtn').style.display = '';
    separatorSel.parentElement.style.display = '';
    dropZone.style.display = '';
  });

})();
