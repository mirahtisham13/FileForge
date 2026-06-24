// FileForge — Base64 Encoder / Decoder Tool
// Pure JS, fully client-side encoding and decoding.

(function () {
  'use strict';

  const textInput     = document.getElementById('textInput');
  const base64Input   = document.getElementById('base64Input');
  const fileInput     = document.getElementById('fileInput');
  const downloadFileBtn = document.getElementById('downloadFileBtn');

  const encodeBtn     = document.getElementById('encodeBtn');
  const decodeBtn     = document.getElementById('decodeBtn');
  const clearTextBtn  = document.getElementById('clearTextBtn');
  const clearB64Btn   = document.getElementById('clearB64Btn');
  const copyBtn       = document.getElementById('copyBtn');

  let currentFileName = null;
  let currentFileType = null;

  // Text Encode
  encodeBtn.addEventListener('click', () => {
    const text = textInput.value;
    if (!text) return;
    try {
      base64Input.value = btoa(unescape(encodeURIComponent(text)));
      showToast('Encoded to Base64', 'success');
    } catch (e) {
      showToast('Encoding failed', 'error');
    }
  });

  // Text Decode
  decodeBtn.addEventListener('click', () => {
    const b64 = base64Input.value.trim();
    if (!b64) return;
    
    // Check if it's a file data URL
    if (b64.startsWith('data:')) {
      const parts = b64.split(',');
      if (parts.length > 1) {
        const mime = parts[0].split(':')[1].split(';')[0];
        const raw = atob(parts[1]);
        const u8 = new Uint8Array(raw.length);
        for(let i=0; i<raw.length; i++) u8[i] = raw.charCodeAt(i);
        const blob = new Blob([u8], {type: mime});
        const url = URL.createObjectURL(blob);
        
        textInput.value = `[File Decoded]\\nType: ${mime}\\nSize: ${blob.size} bytes\\n\\nUse the "Download Decoded File" button above to save it.`;
        
        downloadFileBtn.style.display = 'inline-block';
        downloadFileBtn.onclick = () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = currentFileName || `decoded-file.${mime.split('/')[1] || 'bin'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
        showToast('File decoded from Base64', 'success');
        return;
      }
    }

    // Normal Text decode
    try {
      textInput.value = decodeURIComponent(escape(atob(b64)));
      downloadFileBtn.style.display = 'none';
      showToast('Decoded to text', 'success');
    } catch (e) {
      showToast('Invalid Base64 string', 'error');
    }
  });

  // File Encode
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFileName = file.name;
    currentFileType = file.type;

    const reader = new FileReader();
    reader.onload = (evt) => {
      base64Input.value = evt.target.result; // This includes the data:mime;base64, prefix
      textInput.value = `[File Loaded]\\nName: ${file.name}\\nSize: ${file.size} bytes\\nType: ${file.type}\\n\\nEncoded Base64 is on the right.`;
      showToast('File encoded to Base64', 'success');
    };
    reader.onerror = () => showToast('Failed to read file', 'error');
    reader.readAsDataURL(file);
  });

  // Utils
  clearTextBtn.addEventListener('click', () => { textInput.value = ''; fileInput.value = ''; downloadFileBtn.style.display='none'; });
  clearB64Btn.addEventListener('click', () => { base64Input.value = ''; downloadFileBtn.style.display='none'; });
  
  copyBtn.addEventListener('click', () => {
    if (!base64Input.value) return;
    navigator.clipboard.writeText(base64Input.value).then(() => {
      showToast('Base64 copied to clipboard', 'success');
    });
  });

})();
