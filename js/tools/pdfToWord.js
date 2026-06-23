// FileForge — PDF to Word Tool
// Uses pdf.js to extract text and docx library to build a Word document.

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob } = FFUtils;

  // docx library exposes itself as window.docx via the UMD build
  if (typeof docx === 'undefined') {
    console.error('docx library not loaded. Check CDN URL.');
    showToast('Word library failed to load. Check internet connection.', 'error');
    return;
  }

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const actionPanel = document.getElementById('actionPanel');
  
  const progressWrap = document.getElementById('progressWrap');
  const progressMsg = document.getElementById('progressMsg');
  const progressPct = document.getElementById('progressPct');
  const progressFill = document.getElementById('progressFill');
  
  const resultPanel = document.getElementById('resultPanel');
  const resultInfo = document.getElementById('resultInfo');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');

  let resultBlob = null;
  let resultFileName = '';

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf' });

  async function handleFile(files) {
    const f = files[0];
    if (!f.name.endsWith('.pdf')) {
      showToast('Please select a PDF file', 'error');
      return;
    }
    
    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
    progressWrap.style.display = 'block';
    progressMsg.textContent = 'Loading PDF...';
    
    try {
      const buf = await readFileAsArrayBuffer(f);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      
      const numPages = pdf.numPages;
      const docxParagraphs = [];
      
      for (let i = 1; i <= numPages; i++) {
        progressMsg.textContent = `Extracting page ${i} of ${numPages}...`;
        const pct = Math.round((i / numPages) * 100);
        progressPct.textContent = `${pct}%`;
        progressFill.style.width = `${pct}%`;
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Filter out empty items and sort them to reconstruct reading order
        const items = textContent.items.filter(item => item.str && item.str.trim() !== '');
        
        // Sort items: first by Y (descending, because PDF origin is bottom-left), then by X (ascending)
        items.sort((a, b) => {
          // transform[5] is Y coordinate
          const yDiff = b.transform[5] - a.transform[5];
          // If Y difference is small (e.g. less than 5 points), consider them on the same line
          if (Math.abs(yDiff) < 5) {
            // transform[4] is X coordinate
            return a.transform[4] - b.transform[4];
          }
          return yDiff;
        });

        let currentY = null;
        let currentLine = [];
        const lines = [];

        for (const item of items) {
          if (currentY === null) {
            currentY = item.transform[5];
            currentLine.push(item.str);
          } else {
            if (Math.abs(currentY - item.transform[5]) < 5) {
              currentLine.push(item.str);
            } else {
              lines.push(currentLine.join(' '));
              currentY = item.transform[5];
              currentLine = [item.str];
            }
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }
        
        // Create DOCX paragraphs for this page
        for (const line of lines) {
          docxParagraphs.push(new docx.Paragraph({
            children: [new docx.TextRun(line)]
          }));
        }
        
        // Add a page break after each page (except the last one)
        if (i < numPages) {
           docxParagraphs.push(new docx.Paragraph({
              children: [new docx.PageBreak()]
           }));
        }
      }
      
      progressMsg.textContent = 'Generating DOCX...';
      
      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: docxParagraphs
        }]
      });
      
      resultBlob = await docx.Packer.toBlob(doc);
      resultFileName = f.name.replace('.pdf', '') + '.docx';
      
      progressWrap.style.display = 'none';
      resultPanel.style.display = 'block';
      resultInfo.textContent = `Successfully converted ${numPages} pages into Word Document.`;
      showToast('Conversion successful! 🎉', 'success');
      
    } catch (e) {
      console.error(e);
      showToast('Error converting file: ' + e.message, 'error');
      resetState();
    }
  }

  downloadBtn.addEventListener('click', () => {
    if (resultBlob && resultFileName) downloadBlob(resultBlob, resultFileName);
  });

  resetBtn.addEventListener('click', resetState);

  function resetState() {
    resultBlob = null;
    resultFileName = '';
    actionPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    progressWrap.style.display = 'none';
    dropZone.style.display = '';
    fileInput.value = '';
    progressFill.style.width = '0%';
    progressPct.textContent = '0%';
  }

})();
