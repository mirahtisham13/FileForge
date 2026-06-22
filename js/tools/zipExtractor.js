// FileForge — ZIP Extractor Tool
// Uses JSZip to read ZIP contents locally without uploading

(function () {
  'use strict';

  const { setupDropZone, formatBytes, downloadBlob } = FFUtils;

  let currentZip = null;
  let fileEntries = [];

  const dropZone     = document.getElementById('dropZone');
  const fileInput    = document.getElementById('fileInput');
  const actionPanel  = document.getElementById('actionPanel');
  const zipTitle     = document.getElementById('zipTitle');
  const zipStats     = document.getElementById('zipStats');
  const zipFileList  = document.getElementById('zipFileList');
  const extractAllBtn= document.getElementById('extractAllBtn');
  const resetBtn     = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.zip,application/zip,application/x-zip-compressed' });

  async function handleFile(files) {
    const f = files[0];
    if (!f.name.endsWith('.zip')) { showToast('Please select a ZIP file', 'error'); return; }
    
    dropZone.style.display = 'none';
    actionPanel.classList.add('visible');
    
    zipTitle.textContent = f.name;
    zipStats.textContent = `Loading...`;
    zipFileList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-3);">Reading archive contents...</div>`;
    
    try {
      const zip = new JSZip();
      currentZip = await zip.loadAsync(f);
      
      fileEntries = [];
      let totalSize = 0;
      
      currentZip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          // Some zip entries might not have uncompressedSize correctly set until inflated
          // but JSZip often reads it from headers
          const size = zipEntry._data ? zipEntry._data.uncompressedSize : 0;
          totalSize += size;
          fileEntries.push({ path: relativePath, entry: zipEntry, size: size });
        }
      });
      
      // Sort alphabetically
      fileEntries.sort((a, b) => a.path.localeCompare(b.path));
      
      zipStats.textContent = `${fileEntries.length} files · ${formatBytes(f.size)}`;
      renderFileList();
      
    } catch (e) {
      showToast('Error reading ZIP file: ' + e.message, 'error');
      resetState();
    }
  }

  function renderFileList() {
    zipFileList.innerHTML = '';
    
    if (fileEntries.length === 0) {
      zipFileList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-3);">This ZIP archive is empty.</div>`;
      extractAllBtn.disabled = true;
      return;
    }
    
    extractAllBtn.disabled = false;
    
    const fragment = document.createDocumentFragment();
    
    fileEntries.forEach((file, index) => {
      const isImg = file.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      const isPdf = file.path.match(/\.pdf$/i);
      const isDoc = file.path.match(/\.(doc|docx|txt|md|csv)$/i);
      
      let icon = '📄';
      if (isImg) icon = '🖼️';
      else if (isPdf) icon = '📕';
      else if (isDoc) icon = '📝';
      
      const item = document.createElement('div');
      item.className = 'zip-item';
      item.innerHTML = `
        <div class="zip-item-info">
          <span class="zip-icon">${icon}</span>
          <div>
            <div class="zip-name">${file.path}</div>
            <div class="zip-size">${file.size > 0 ? formatBytes(file.size) : 'Unknown size'}</div>
          </div>
        </div>
        <button class="zip-btn" data-index="${index}">⬇️ Save</button>
      `;
      
      item.querySelector('.zip-btn').addEventListener('click', () => downloadSingleFile(index));
      fragment.appendChild(item);
    });
    
    zipFileList.appendChild(fragment);
  }

  async function downloadSingleFile(index) {
    const file = fileEntries[index];
    const btn = zipFileList.querySelectorAll('.zip-btn')[index];
    
    btn.disabled = true;
    btn.textContent = '⏳';
    
    try {
      const blob = await file.entry.async('blob');
      // Extract just the filename from the path
      const fileName = file.path.split('/').pop() || 'extracted_file';
      downloadBlob(blob, fileName);
    } catch (e) {
      showToast('Error extracting file', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '⬇️ Save';
  }

  extractAllBtn.addEventListener('click', async () => {
    // Standard download of all files is tricky without a File System API
    // We will just recreate a clean zip without directories or just prompt the user
    // to extract what they need, or if they have modern browsers, we could use File System Access API.
    // For now, downloading a new ZIP isn't very useful (they already have one).
    // Let's use the File System Access API if available, otherwise fallback to alerting.
    
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker({
          mode: 'readwrite'
        });
        
        extractAllBtn.disabled = true;
        extractAllBtn.textContent = '⏳ Extracting to folder...';
        
        let successCount = 0;
        
        for (const file of fileEntries) {
          try {
            // Handle subdirectories by creating them
            const pathParts = file.path.split('/');
            const fileName = pathParts.pop();
            let currentDir = dirHandle;
            
            for (const part of pathParts) {
              currentDir = await currentDir.getDirectoryHandle(part, { create: true });
            }
            
            const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            const blob = await file.entry.async('blob');
            await writable.write(blob);
            await writable.close();
            successCount++;
          } catch (err) {
            console.error(`Failed to write ${file.path}`, err);
          }
        }
        
        showToast(`Successfully extracted ${successCount} files to folder! 🎉`, 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Could not access folder: ' + err.message, 'error');
        }
      } finally {
        extractAllBtn.disabled = false;
        extractAllBtn.textContent = '⬇️ Extract All (Save as Folder)';
      }
    } else {
      showToast('Your browser does not support extracting to a folder. Please download files individually.', 'error');
    }
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    currentZip = null;
    fileEntries = [];
    zipFileList.innerHTML = '';
    actionPanel.classList.remove('visible');
    dropZone.style.display = '';
  }

})();
