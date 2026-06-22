// FileForge — QR Code Generator
// Uses qrcode.js from CDN to generate QR codes with custom colors and types

(function () {
  'use strict';

  const { downloadBlob } = FFUtils;

  let currentQRData = '';
  let qrSize = 256;
  let qrColor = '#000000';
  let bgColor = '#ffffff';
  let errorLevel = 'M';
  let qrType = 'url';
  let qrInstance = null;

  const inputArea    = document.getElementById('inputArea');
  const generateBtn  = document.getElementById('generateBtn');
  const qrCanvas     = document.getElementById('qrCanvas');
  const qrPlaceholder= document.getElementById('qrPlaceholder');
  const downloadBtns = document.getElementById('downloadBtns');
  const downloadPng  = document.getElementById('downloadPng');
  const downloadSvg  = document.getElementById('downloadSvg');
  const copyBtn      = document.getElementById('copyBtn');
  const qrColorEl    = document.getElementById('qrColor');
  const bgColorEl    = document.getElementById('bgColor');
  const errorLevelEl = document.getElementById('errorLevel');

  // ── QR Type templates ──
  const typeTemplates = {
    url: {
      label: 'URL',
      fields: [{ id:'urlInput', label:'Website URL', placeholder:'https://example.com', type:'url' }],
      build: (vals) => vals.urlInput || ''
    },
    text: {
      label: 'Text',
      fields: [{ id:'textInput', label:'Text Content', placeholder:'Enter any text...', type:'textarea' }],
      build: (vals) => vals.textInput || ''
    },
    email: {
      label: 'Email',
      fields: [
        { id:'emailAddr', label:'Email Address', placeholder:'user@example.com', type:'email' },
        { id:'emailSub', label:'Subject (optional)', placeholder:'Hello!', type:'text' },
        { id:'emailBody', label:'Message (optional)', placeholder:'...', type:'textarea' }
      ],
      build: (vals) => {
        let s = `mailto:${vals.emailAddr}`;
        const params = [];
        if (vals.emailSub) params.push(`subject=${encodeURIComponent(vals.emailSub)}`);
        if (vals.emailBody) params.push(`body=${encodeURIComponent(vals.emailBody)}`);
        if (params.length) s += '?' + params.join('&');
        return s;
      }
    },
    phone: {
      label: 'Phone',
      fields: [{ id:'phoneNum', label:'Phone Number', placeholder:'+1 234 567 8900', type:'tel' }],
      build: (vals) => `tel:${(vals.phoneNum||'').replace(/\s/g,'')}`
    },
    wifi: {
      label: 'WiFi',
      fields: [
        { id:'wifiSSID', label:'Network Name (SSID)', placeholder:'MyWiFi', type:'text' },
        { id:'wifiPass', label:'Password', placeholder:'password', type:'text' },
        { id:'wifiEnc', label:'Encryption', placeholder:'', type:'select', options:['WPA','WEP','nopass'] }
      ],
      build: (vals) => `WIFI:T:${vals.wifiEnc||'WPA'};S:${vals.wifiSSID};P:${vals.wifiPass};;`
    },
    vcard: {
      label: 'vCard',
      fields: [
        { id:'vcName', label:'Full Name', placeholder:'John Doe', type:'text' },
        { id:'vcPhone', label:'Phone', placeholder:'+1 234 567 8900', type:'tel' },
        { id:'vcEmail', label:'Email', placeholder:'john@example.com', type:'email' },
        { id:'vcOrg', label:'Organization (optional)', placeholder:'Company', type:'text' },
        { id:'vcUrl', label:'Website (optional)', placeholder:'https://...', type:'url' }
      ],
      build: (vals) => {
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vals.vcName}\nTEL:${vals.vcPhone}\nEMAIL:${vals.vcEmail}\nORG:${vals.vcOrg||''}\nURL:${vals.vcUrl||''}\nEND:VCARD`;
      }
    }
  };

  function renderInputArea() {
    const tmpl = typeTemplates[qrType];
    if (!tmpl) return;
    inputArea.innerHTML = tmpl.fields.map(f => {
      if (f.type === 'textarea') {
        return `<div class="option-group" style="margin-bottom:12px;"><label for="${f.id}">${f.label}</label>
          <textarea id="${f.id}" placeholder="${f.placeholder}" rows="3"
            style="padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit;font-size:0.9rem;width:100%;resize:vertical;"></textarea></div>`;
      }
      if (f.type === 'select') {
        return `<div class="option-group" style="margin-bottom:12px;"><label for="${f.id}">${f.label}</label>
          <select id="${f.id}">${f.options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`;
      }
      return `<div class="option-group" style="margin-bottom:12px;"><label for="${f.id}">${f.label}</label>
        <input type="${f.type}" id="${f.id}" placeholder="${f.placeholder}"/></div>`;
    }).join('');
  }

  // ── Type buttons ──
  document.querySelectorAll('.qr-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qr-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qrType = btn.dataset.type;
      renderInputArea();
    });
  });

  // ── Size buttons ──
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qrSize = parseInt(btn.dataset.size);
    });
  });

  // ── Color pickers ──
  qrColorEl.addEventListener('input', () => { qrColor = qrColorEl.value; });
  bgColorEl.addEventListener('input', () => { bgColor = bgColorEl.value; });
  errorLevelEl.addEventListener('change', () => { errorLevel = errorLevelEl.value; });

  function getQRData() {
    const tmpl = typeTemplates[qrType];
    const vals = {};
    tmpl.fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) vals[f.id] = el.value.trim();
    });
    return tmpl.build(vals);
  }

  function generateQR() {
    const data = getQRData();
    if (!data || data.length < 2) { showToast('Please fill in the required fields', 'error'); return; }
    currentQRData = data;

    // Clear old QR
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    try {
      new QRCode(container, {
        text: data,
        width: qrSize,
        height: qrSize,
        colorDark: qrColor,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel[errorLevel]
      });

      // QRCode library creates a canvas or img inside container
      setTimeout(() => {
        const srcCanvas = container.querySelector('canvas');
        const srcImg = container.querySelector('img');

        if (srcCanvas) {
          qrCanvas.width = qrSize;
          qrCanvas.height = qrSize;
          const ctx = qrCanvas.getContext('2d');
          ctx.drawImage(srcCanvas, 0, 0, qrSize, qrSize);
        } else if (srcImg) {
          qrCanvas.width = qrSize;
          qrCanvas.height = qrSize;
          const ctx = qrCanvas.getContext('2d');
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, qrSize, qrSize);
          img.src = srcImg.src;
        }

        document.body.removeChild(container);
        qrCanvas.style.display = 'block';
        qrCanvas.style.width = Math.min(qrSize, 280) + 'px';
        qrCanvas.style.height = Math.min(qrSize, 280) + 'px';
        qrPlaceholder.style.display = 'none';
        downloadBtns.style.display = 'flex';
        showToast('QR code generated! 🎉', 'success');
      }, 100);
    } catch (e) {
      document.body.removeChild(container);
      showToast('Error generating QR: ' + e.message, 'error');
    }
  }

  generateBtn.addEventListener('click', generateQR);

  // Auto-generate on Enter in inputs
  inputArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      generateQR();
    }
  });

  // ── Downloads ──
  downloadPng.addEventListener('click', () => {
    qrCanvas.toBlob(blob => {
      downloadBlob(blob, `fileforge-qr-${qrType}.png`);
    }, 'image/png');
  });

  downloadSvg.addEventListener('click', () => {
    // Generate SVG representation using canvas pixel data as a fallback
    const size = qrSize;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <image href="${qrCanvas.toDataURL('image/png')}" width="${size}" height="${size}"/>
    </svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadBlob(blob, `fileforge-qr-${qrType}.svg`);
  });

  copyBtn.addEventListener('click', async () => {
    try {
      qrCanvas.toBlob(async blob => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('QR code copied to clipboard!', 'success');
      }, 'image/png');
    } catch {
      showToast('Copy not supported in this browser', 'error');
    }
  });

  // Init
  renderInputArea();

})();
