// FileForge — PDF to Word Tool (v2)
// Uses pdf.js to extract text content.
// Builds a valid .docx (Office Open XML) from scratch using JSZip.
// No external docx library needed — a .docx is just a ZIP of XML files.

(function () {
  'use strict';

  const { setupDropZone, readFileAsArrayBuffer, downloadBlob } = FFUtils;

  const dropZone    = document.getElementById('dropZone');
  const fileInput   = document.getElementById('fileInput');
  const actionPanel = document.getElementById('actionPanel');

  const progressWrap = document.getElementById('progressWrap');
  const progressMsg  = document.getElementById('progressMsg');
  const progressPct  = document.getElementById('progressPct');
  const progressFill = document.getElementById('progressFill');

  const resultPanel = document.getElementById('resultPanel');
  const resultInfo  = document.getElementById('resultInfo');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn    = document.getElementById('resetBtn');

  let resultBlob = null;
  let resultFileName = '';

  setupDropZone(dropZone, fileInput, handleFile, { multiple: false, accept: '.pdf,.docx' });

  // ─── DOCX builder helpers ───────────────────────────────────────────────────

  function escXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function makeParagraph(text) {
    return `<w:p><w:r><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;
  }

  function makePageBreak() {
    return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
  }

  function buildDocx(paragraphXmlBlocks) {
    const body = paragraphXmlBlocks.join('\n');

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

    const dotRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`;

    const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
            xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex"
            xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid"
            xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml"
            xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash"
            xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex"
            xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
            xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
            xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
  <w:body>
${body}
    <w:sectPr/>
  </w:body>
</w:document>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    zip.file('_rels/.rels', dotRels);
    zip.file('word/document.xml', document);
    zip.file('word/_rels/document.xml.rels', wordRels);
    zip.file('word/styles.xml', styles);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // ─── Main handler ──────────────────────────────────────────────────────────

  async function handleFile(files) {
    const f = files[0];
    const isPdf = f.name.toLowerCase().endsWith('.pdf');
    const isDocx = f.name.toLowerCase().endsWith('.docx');

    if (!isPdf && !isDocx) {
      showToast('Please select a PDF or DOCX file', 'error');
      return;
    }

    dropZone.style.display = 'none';
    actionPanel.style.display = 'block';
    progressWrap.style.display = 'block';
    progressMsg.textContent = 'Loading PDF...';

    try {
      if (isPdf) {
        await convertPdfToDocx(buf, f.name);
      } else {
        await convertDocxToPdf(buf, f.name);
      }

      progressPct.textContent = '100%';
      progressFill.style.width = '100%';
      setTimeout(() => { progressWrap.style.display = 'none'; }, 400);

      resultPanel.style.display = 'block';
      resultInfo.textContent = `Converted ${numPages} page${numPages !== 1 ? 's' : ''} → Word document ready.`;
      showToast('Conversion complete! 🎉', 'success');

    } catch (e) {
      console.error(e);
      showToast('Error: ' + e.message, 'error');
      resetState();
    }
  }

  // ─── Converters ──────────────────────────────────────────────────────────────

  async function convertPdfToDocx(buf, name) {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    const numPages = pdf.numPages;
    const xmlBlocks = [];

    for (let i = 1; i <= numPages; i++) {
      progressMsg.textContent = `Extracting page ${i} of ${numPages}...`;
      const pct = Math.round((i / numPages) * 90);
      progressPct.textContent = `${pct}%`;
      progressFill.style.width = `${pct}%`;

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items.filter(it => it.str && it.str.trim() !== '');

      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) < 5) return a.transform[4] - b.transform[4];
        return yDiff;
      });

      let currentY = null;
      let currentLine = [];
      const lines = [];

      for (const item of items) {
        const y = item.transform[5];
        if (currentY === null) {
          currentY = y;
          currentLine.push(item.str);
        } else if (Math.abs(currentY - y) < 5) {
          currentLine.push(item.str);
        } else {
          lines.push(currentLine.join(' '));
          currentY = y;
          currentLine = [item.str];
        }
      }
      if (currentLine.length > 0) lines.push(currentLine.join(' '));

      for (const line of lines) { xmlBlocks.push(makeParagraph(line)); }
      if (i < numPages) xmlBlocks.push(makePageBreak());
    }

    progressMsg.textContent = 'Building Word document...';
    progressPct.textContent = '95%';
    progressFill.style.width = '95%';

    resultBlob = await buildDocx(xmlBlocks);
    resultFileName = name.replace(/\.pdf$/i, '') + '.docx';
    resultInfo.textContent = `Converted ${numPages} page${numPages !== 1 ? 's' : ''} → Word document ready.`;
    downloadBtn.textContent = '⬇️ Download DOCX';
  }

  async function convertDocxToPdf(buf, name) {
    progressMsg.textContent = 'Parsing Word Document...';
    progressPct.textContent = '30%';
    progressFill.style.width = '30%';

    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    const text = result.value;

    progressMsg.textContent = 'Generating PDF...';
    progressPct.textContent = '60%';
    progressFill.style.width = '60%';

    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const margin = 50;
    
    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    const maxW = width - (margin * 2);
    let cursorY = height - margin;

    const paragraphs = text.split('\n');

    for (const p of paragraphs) {
      if (!p.trim()) {
        cursorY -= fontSize * 1.5;
        if (cursorY < margin) { page = pdfDoc.addPage(); cursorY = height - margin; }
        continue;
      }
      
      const words = p.split(' ');
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testW = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testW > maxW && i > 0) {
          if (cursorY < margin) { page = pdfDoc.addPage(); cursorY = height - margin; }
          page.drawText(line, { x: margin, y: cursorY, size: fontSize, font, color: rgb(0,0,0) });
          cursorY -= fontSize * 1.5;
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line.trim()) {
        if (cursorY < margin) { page = pdfDoc.addPage(); cursorY = height - margin; }
        page.drawText(line, { x: margin, y: cursorY, size: fontSize, font, color: rgb(0,0,0) });
        cursorY -= fontSize * 1.5;
      }
      cursorY -= fontSize * 0.5; // Paragraph spacing
    }

    progressPct.textContent = '90%';
    progressFill.style.width = '90%';
    
    const pdfBytes = await pdfDoc.save();
    resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    resultFileName = name.replace(/\.docx$/i, '') + '.pdf';
    
    const numPages = pdfDoc.getPageCount();
    resultInfo.textContent = `Generated ${numPages} page PDF from Word document.`;
    downloadBtn.textContent = '⬇️ Download PDF';
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
