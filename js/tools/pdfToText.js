// FileForge — PDF to Text Tool
// Uses pdf.js to extract raw text content from a PDF

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob } = FFUtils;

  let currentFile = null;
  let pdfTextContent = '';

  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const actionPanel    = document.getElementById('actionPanel');
  const progressWrap   = document.getElementById('progressWrap');
  const progressMsg    = document.getElementById('progressMsg');
  const progressPct    = document.getElementById('progressPct');
  const progressFill   = document.getElementById('progressFill');
  const resultArea     = document.getElementById('resultArea');
  const pdfTextResult  = document.getElementById('pdfTextResult');
  const copyBtn        = document.getElementById('copyBtn');
  const downloadTxtBtn = document.getElementById('downloadTxtBtn');
  const resetBtn       = document.getElementById('resetBtn');

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) { showToast('Please select a PDF file', 'error'); return; }
    
    currentFile = f;
    dropZone.style.display = 'none';
    actionPanel.classList.add('visible');
    
    progressWrap.style.display = 'block';
    progressMsg.textContent = 'Loading PDF...';
    progressPct.textContent = '0%';
    progressFill.style.width = '0%';
    resultArea.style.display = 'none';
    pdfTextResult.value = '';
    pdfTextContent = '';

    try {
      const buf = await readFileAsArrayBuffer(f);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      
      const numPages = pdf.numPages;
      let fullText = '';
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Basic heuristic to insert newlines
        let lastY = -1;
        let pageText = '';
        
        for (const item of textContent.items) {
          if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += '\n';
          }
          pageText += item.str;
          lastY = item.transform[5];
        }
        
        fullText += `--- Page ${i} ---\n\n${pageText}\n\n`;
        
        const pct = Math.round((i / numPages) * 100);
        progressPct.textContent = `${pct}%`;
        progressFill.style.width = `${pct}%`;
        progressMsg.textContent = `Extracting page ${i} of ${numPages}...`;
      }
      
      pdfTextContent = fullText;
      pdfTextResult.value = fullText;
      
      progressWrap.style.display = 'none';
      resultArea.style.display = 'flex';
      showToast('Text extracted successfully! 🎉', 'success');
      
    } catch (e) {
      showToast('Error extracting text: ' + e.message, 'error');
      progressWrap.style.display = 'none';
      dropZone.style.display = '';
      actionPanel.classList.remove('visible');
    }
  }

  copyBtn.addEventListener('click', async () => {
    if (!pdfTextContent) return;
    try {
      await navigator.clipboard.writeText(pdfTextContent);
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy text', 'error');
    }
  });

  downloadTxtBtn.addEventListener('click', () => {
    if (!pdfTextContent) return;
    const blob = new Blob([pdfTextContent], { type: 'text/plain;charset=utf-8' });
    const baseName = (currentFile?.name || 'document').replace('.pdf', '');
    downloadBlob(blob, `${baseName}-text.txt`);
  });

  resetBtn.addEventListener('click', () => {
    currentFile = null;
    pdfTextContent = '';
    pdfTextResult.value = '';
    resultArea.style.display = 'none';
    actionPanel.classList.remove('visible');
    dropZone.style.display = '';
  });

})();
