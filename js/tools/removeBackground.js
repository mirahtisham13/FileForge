// FileForge — Remove Background Tool
// Uses @imgly/background-removal for local AI processing

(function () {
  'use strict';

  const { setupDropZone, downloadBlob } = FFUtils;

  let baseFile = null;
  let resultBlob = null;

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const origImg        = document.getElementById('origImg');
  const resultImg      = document.getElementById('resultImg');
  const loaderArea     = document.getElementById('loaderArea');
  const loadingText    = document.getElementById('loadingText');
  
  const resultPanel    = document.getElementById('resultPanel');
  const downloadBtn    = document.getElementById('downloadBtn');
  const resetBtn       = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: 'image/jpeg,image/png,image/webp' });

  async function handleFile(files) {
    const f = files[0];
    if (!f.type.startsWith('image/')) { showToast('Please select an image', 'error'); return; }
    
    baseFile = f;
    const url = URL.createObjectURL(f);
    origImg.src = url;
    
    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
    
    processImage(f);
  }

  async function processImage(file) {
    try {
      // Configuration for @imgly/background-removal
      // We will use the smaller model for web performance
      const config = {
        publicPath: 'https://static.imgly.com/@imgly/background-removal-data/1.4.3/dist/',
        model: 'small', // small model is faster and uses less memory
        output: {
          format: 'image/png',
          quality: 1
        },
        progress: (key, current, total) => {
          if (key === 'compute:inference') {
            loadingText.textContent = `Processing image...`;
          } else if (total > 0) {
            const pct = Math.round((current / total) * 100);
            loadingText.textContent = `Downloading AI model... ${pct}%`;
          } else {
            loadingText.textContent = `Initializing AI...`;
          }
        }
      };

      // Dynamically import the ESM module since imgly no longer provides a UMD bundle
      const imgly = await import('https://unpkg.com/@imgly/background-removal@1.4.3/dist/index.mjs');
      const imglyRemoveBackground = imgly.default || imgly.removeBackground;

      // Call imglyRemoveBackground
      const imageBlob = await imglyRemoveBackground(file, config);
      
      resultBlob = imageBlob;
      const resUrl = URL.createObjectURL(imageBlob);
      
      resultImg.src = resUrl;
      resultImg.style.display = 'block';
      loaderArea.style.display = 'none';
      
      resultPanel.style.display = 'block';
      showToast('Background removed successfully! 🎉', 'success');
      
    } catch (e) {
      loaderArea.style.display = 'none';
      loadingText.textContent = 'Failed to remove background.';
      showToast('Error: ' + (e.message || e), 'error');
      console.error(e);
    }
  }

  downloadBtn.addEventListener('click', () => {
    if (resultBlob && baseFile) {
      const baseName = baseFile.name.replace(/\.[^.]+$/, '');
      downloadBlob(resultBlob, `${baseName}-nobg.png`);
    }
  });

  resetBtn.addEventListener('click', () => {
    baseFile = null;
    resultBlob = null;
    
    origImg.src = '';
    resultImg.src = '';
    resultImg.style.display = 'none';
    
    loaderArea.style.display = 'block';
    loadingText.textContent = 'Downloading AI models (first time only)...';
    
    actionPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    dropZone.style.display = '';
  });

})();
