/**
 * pdf-encrypt-lite — Browser Bundle
 * Original by PDFSmaller.com (MIT License)
 * Adapted for browser use (no CommonJS require/exports)
 * https://github.com/smither777/pdfsmaller-pdfencryptlite
 *
 * Requires pdf-lib to be loaded first (window.PDFLib)
 */

(function (global) {
  // ── Minimal MD5 ──────────────────────────────────────────────────────────
  function md5(data) {
    const bytes = (data instanceof Uint8Array) ? data : new TextEncoder().encode(data);
    const S = [
      7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
      5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
      4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
      6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21
    ];
    const K = new Uint32Array([
      0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
      0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
      0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
      0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
      0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
      0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
      0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
      0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
    ]);
    let a0=0x67452301, b0=0xefcdab89, c0=0x98badcfe, d0=0x10325476;
    const msgLen = bytes.length;
    const msgLenPadded = ((msgLen + 9 + 63) & ~63);
    const msg = new Uint8Array(msgLenPadded);
    msg.set(bytes);
    msg[msgLen] = 0x80;
    const dv = new DataView(msg.buffer);
    dv.setUint32(msgLenPadded - 8, msgLen * 8, true);
    dv.setUint32(msgLenPadded - 4, 0, true);
    for (let off = 0; off < msgLenPadded; off += 64) {
      const chunk = new Uint32Array(msg.buffer, off, 16);
      let a=a0, b=b0, c=c0, d=d0;
      for (let i=0; i<64; i++) {
        let f, g;
        if      (i<16) { f=(b&c)|((~b)&d); g=i; }
        else if (i<32) { f=(d&b)|((~d)&c); g=(5*i+1)%16; }
        else if (i<48) { f=b^c^d;          g=(3*i+5)%16; }
        else           { f=c^(b|(~d));      g=(7*i)%16; }
        f=(f+a+K[i]+chunk[g])>>>0;
        a=d; d=c; c=b;
        b=(b+((f<<S[i])|(f>>>(32-S[i]))))>>>0;
      }
      a0=(a0+a)>>>0; b0=(b0+b)>>>0; c0=(c0+c)>>>0; d0=(d0+d)>>>0;
    }
    const res = new Uint8Array(16);
    const rv = new DataView(res.buffer);
    rv.setUint32(0,a0,true); rv.setUint32(4,b0,true);
    rv.setUint32(8,c0,true); rv.setUint32(12,d0,true);
    return res;
  }

  // ── RC4 ──────────────────────────────────────────────────────────────────
  class RC4 {
    constructor(key) {
      this.s = new Uint8Array(256);
      this.i = 0; this.j = 0;
      for (let i=0;i<256;i++) this.s[i]=i;
      let j=0;
      for (let i=0;i<256;i++) {
        j=(j+this.s[i]+key[i%key.length])&0xFF;
        [this.s[i],this.s[j]]=[this.s[j],this.s[i]];
      }
    }
    process(data) {
      const res = new Uint8Array(data.length);
      for (let k=0;k<data.length;k++) {
        this.i=(this.i+1)&0xFF;
        this.j=(this.j+this.s[this.i])&0xFF;
        [this.s[this.i],this.s[this.j]]=[this.s[this.j],this.s[this.i]];
        const t=(this.s[this.i]+this.s[this.j])&0xFF;
        res[k]=data[k]^this.s[t];
      }
      return res;
    }
  }

  function hexToBytes(hex) {
    const b = new Uint8Array(hex.length/2);
    for (let i=0;i<b.length;i++) b[i]=parseInt(hex.substr(i*2,2),16);
    return b;
  }
  function bytesToHex(bytes) {
    return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  // ── PDF Encryption helpers ────────────────────────────────────────────────
  const PADDING = new Uint8Array([
    0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,
    0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A
  ]);

  function padPassword(password) {
    const pwdBytes = new TextEncoder().encode(password);
    const padded = new Uint8Array(32);
    if (pwdBytes.length >= 32) { padded.set(pwdBytes.slice(0,32)); }
    else { padded.set(pwdBytes); padded.set(PADDING.slice(0,32-pwdBytes.length), pwdBytes.length); }
    return padded;
  }

  function computeEncryptionKey(userPassword, ownerKey, permissions, fileId) {
    const paddedPwd = padPassword(userPassword);
    const hashInput = new Uint8Array(paddedPwd.length + ownerKey.length + 4 + fileId.length);
    let off = 0;
    hashInput.set(paddedPwd, off); off += paddedPwd.length;
    hashInput.set(ownerKey, off); off += ownerKey.length;
    hashInput[off++]=permissions&0xFF; hashInput[off++]=(permissions>>8)&0xFF;
    hashInput[off++]=(permissions>>16)&0xFF; hashInput[off++]=(permissions>>24)&0xFF;
    hashInput.set(fileId, off);
    let hash = md5(hashInput);
    for (let i=0;i<50;i++) hash = md5(hash.slice(0,16));
    return hash.slice(0,16);
  }

  function computeOwnerKey(ownerPassword, userPassword) {
    const ownerPwd = ownerPassword || userPassword;
    const paddedOwner = padPassword(ownerPwd);
    let hash = md5(paddedOwner);
    for (let i=0;i<50;i++) hash = md5(hash.slice(0,16));
    const ownerKey = hash.slice(0,16);
    const paddedUser = padPassword(userPassword);
    let encrypted = new RC4(ownerKey).process(paddedUser);
    for (let i=1;i<=19;i++) {
      const k = new Uint8Array(ownerKey.length);
      for (let j=0;j<ownerKey.length;j++) k[j]=ownerKey[j]^i;
      encrypted = new RC4(k).process(encrypted);
    }
    return encrypted;
  }

  function computeUserKey(encryptionKey, fileId) {
    const hashInput = new Uint8Array(PADDING.length + fileId.length);
    hashInput.set(PADDING); hashInput.set(fileId, PADDING.length);
    const hash = md5(hashInput);
    let result = new RC4(encryptionKey).process(hash);
    for (let i=1;i<=19;i++) {
      const k = new Uint8Array(encryptionKey.length);
      for (let j=0;j<encryptionKey.length;j++) k[j]=encryptionKey[j]^i;
      result = new RC4(k).process(result);
    }
    const finalResult = new Uint8Array(32);
    finalResult.set(result);
    return finalResult;
  }

  function encryptObject(data, objectNum, generationNum, encryptionKey) {
    const keyInput = new Uint8Array(encryptionKey.length + 5);
    keyInput.set(encryptionKey);
    keyInput[encryptionKey.length]  = objectNum&0xFF;
    keyInput[encryptionKey.length+1]=(objectNum>>8)&0xFF;
    keyInput[encryptionKey.length+2]=(objectNum>>16)&0xFF;
    keyInput[encryptionKey.length+3]= generationNum&0xFF;
    keyInput[encryptionKey.length+4]=(generationNum>>8)&0xFF;
    const objectKey = md5(keyInput);
    return new RC4(objectKey.slice(0, Math.min(encryptionKey.length+5,16))).process(data);
  }

  function encryptStringsInObject(obj, objectNum, generationNum, encryptionKey) {
    const { PDFString, PDFHexString, PDFDict, PDFArray, PDFName } = window.PDFLib;
    if (!obj) return;
    if (obj instanceof PDFString) {
      const originalBytes = obj.asBytes();
      const encrypted = encryptObject(originalBytes, objectNum, generationNum, encryptionKey);
      obj.value = Array.from(encrypted).map(b=>String.fromCharCode(b)).join('');
    } else if (obj instanceof PDFHexString) {
      const originalBytes = obj.asBytes();
      const encrypted = encryptObject(originalBytes, objectNum, generationNum, encryptionKey);
      obj.value = bytesToHex(encrypted);
    } else if (obj instanceof PDFDict) {
      const entries = obj.entries();
      for (const [key, value] of entries) {
        const keyName = key.asString();
        if (keyName !== '/Length' && keyName !== '/Filter' && keyName !== '/DecodeParms') {
          encryptStringsInObject(value, objectNum, generationNum, encryptionKey);
        }
      }
    } else if (obj instanceof PDFArray) {
      for (const element of obj.asArray()) {
        encryptStringsInObject(element, objectNum, generationNum, encryptionKey);
      }
    }
  }

  // ── Main encryptPDF function ──────────────────────────────────────────────
  async function encryptPDF(pdfBytes, userPassword, ownerPassword) {
    const { PDFDocument, PDFName, PDFHexString, PDFNumber, PDFRawStream } = window.PDFLib;

    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    const context = pdfDoc.context;
    const trailer = context.trailerInfo;

    // Get or generate file ID
    let fileId;
    const idArray = trailer.ID;
    if (idArray && Array.isArray(idArray) && idArray.length > 0) {
      const idString = idArray[0].toString();
      const hexStr = idString.replace(/^<|>$/g, '');
      if (hexStr.length >= 2) {
        fileId = hexToBytes(hexStr);
      }
    }
    if (!fileId || fileId.length === 0) {
      fileId = new Uint8Array(16);
      crypto.getRandomValues(fileId);
      trailer.ID = [
        PDFHexString.of(bytesToHex(fileId)),
        PDFHexString.of(bytesToHex(fileId))
      ];
    }

    const permissions = 0xFFFFFFFC;
    const ownerKey    = computeOwnerKey(ownerPassword, userPassword);
    const encKey      = computeEncryptionKey(userPassword, ownerKey, permissions, fileId);
    const userKey     = computeUserKey(encKey, fileId);

    // Encrypt all indirect objects
    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      const objNum = ref.objectNumber;
      const genNum = ref.generationNumber || 0;

      // Skip the encryption dict (it shouldn't exist yet but just in case)
      if (obj instanceof PDFRawStream && obj.dict) {
        const type = obj.dict.get(PDFName.of('Type'));
        if (type && (type.toString() === '/XRef' || type.toString() === '/Sig')) continue;
      }

      if (obj instanceof PDFRawStream) {
        obj.contents = encryptObject(obj.contents, objNum, genNum, encKey);
        if (obj.dict) encryptStringsInObject(obj.dict, objNum, genNum, encKey);
      } else {
        encryptStringsInObject(obj, objNum, genNum, encKey);
      }
    }

    // Build /Encrypt dictionary
    const encryptDict = context.obj({
      Filter:  PDFName.of('Standard'),
      V:       PDFNumber.of(2),
      R:       PDFNumber.of(3),
      Length:  PDFNumber.of(128),
      P:       PDFNumber.of(permissions),
      O:       PDFHexString.of(bytesToHex(ownerKey)),
      U:       PDFHexString.of(bytesToHex(userKey))
    });

    trailer.Encrypt = context.register(encryptDict);

    return await pdfDoc.save({ useObjectStreams: false });
  }

  // Expose to global scope
  global.PdfEncryptLite = { encryptPDF };

})(window);
