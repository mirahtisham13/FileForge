<div align="center">
  <img src="assets/icons/icon-512.png" alt="FileForge Logo" width="120" />

  # FileForge
  **Edit files without uploading them.**
  
  <p>
    100% private, browser-based tools. No limits, no accounts, and your files never leave your device.
  </p>

  <!-- Badges -->
  <p>
    <a href="https://github.com/mirahtisham13/FileForge/stargazers">
      <img src="https://img.shields.io/github/stars/mirahtisham13/FileForge?style=flat-square" alt="Stars" />
    </a>
    <a href="https://github.com/mirahtisham13/FileForge/network/members">
      <img src="https://img.shields.io/github/forks/mirahtisham13/FileForge?style=flat-square" alt="Forks" />
    </a>
    <a href="https://github.com/mirahtisham13/FileForge/issues">
      <img src="https://img.shields.io/github/issues/mirahtisham13/FileForge?style=flat-square" alt="Issues" />
    </a>
    <a href="https://github.com/mirahtisham13/FileForge/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" />
    </a>
  </p>
</div>

---

## 🚀 Overview

FileForge is a comprehensive suite of over 30 file manipulation utilities built entirely for the modern web. Unlike traditional cloud-based tools (like iLovePDF or Adobe Acrobat Online) that require you to upload sensitive documents to remote servers, **FileForge processes everything locally inside your browser.**

By leveraging modern Web APIs, WebAssembly (WASM), and Service Workers, FileForge brings desktop-grade speed and absolute privacy to a web application.

### Why FileForge?
- **🛡️ Zero Uploads:** Your files are processed securely in your local browser's memory. They never touch a cloud server.
- **⚡ WebAssembly Powered:** Runs compiled C++ algorithms (like PDF compression and image processing) directly inside your browser.
- **💎 Always Free:** Because we don't have to pay for expensive backend compute servers, FileForge has no paywalls or file-size limits.
- **📱 Progressive Web App (PWA):** Install FileForge directly to your macOS, Windows, iOS, or Android device. It even works completely offline!

---

## 🛠️ Features & Tools

FileForge includes dozens of tools categorized into three main sections:

### 📄 PDF Tools
- **Merge PDF:** Combine multiple PDF files into one document.
- **Compress PDF:** Drastically reduce PDF file size without losing readability.
- **Split PDF:** Extract pages or split a PDF into multiple files.
- **Protect PDF:** Add 256-bit AES password encryption to your PDF.
- **Images to PDF:** Convert JPG, PNG, and WebP images into a single PDF.

### 🖼️ Image Tools
- **Compress Image:** Shrink JPEG, PNG, and WebP files instantly.
- **Convert Image:** Convert images between multiple formats locally.
- **Resize Image:** Change image dimensions for web and social media.
- **Crop Image:** Freeform or aspect-ratio image cropping.

### 🔐 Security & Utilities
- **Secure Password Generator:** Generate cryptographically secure passwords offline.
- **QR Code Generator:** Create QR codes for WiFi, URLs, and text.
- **Base64 Encoder/Decoder:** Developer utility for fast text encoding.
- **Text & Word Counter:** Instant analytics for your text.

---

## 🏗️ Architecture

FileForge is a strictly **Client-Side Architecture**. There is no Node.js backend, no database, and no API required. 

**Tech Stack:**
- **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+). No bulky frontend frameworks (React/Vue), ensuring lightning-fast load times.
- **PDF Processing:** Powered by `pdf-lib` and `pdf.js`.
- **PWA Integration:** Custom Service Worker (`sw.js`) with aggressive caching for offline support and the **Web Share Target API** to act as a native share receiver on mobile devices.
- **Programmatic SEO (pSEO):** A custom Node.js build script (`scripts/build-seo.js`) that dynamically generates highly-targeted static landing pages for massive organic traffic.

---

## 💻 Local Development

Because FileForge has no backend, getting it running locally is incredibly simple.

### Prerequisites
- You only need a simple local HTTP server (like `live-server`, `python -m http.server`, or the VSCode Live Server extension).

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/mirahtisham13/FileForge.git
   ```
2. Navigate into the directory:
   ```bash
   cd FileForge
   ```
3. Start a local server:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8000
   ```
4. Open your browser and navigate to `http://localhost:8000`.

*(Note: FileForge must be served over `http://localhost` or `https://` for the Service Worker and PWA features to function correctly due to browser security restrictions).*

---

## 📈 Programmatic SEO Engine

FileForge includes a custom pSEO engine to capture massive long-tail search volume (e.g., *"Compress PDF to 100KB"*).

To generate or update the SEO landing pages:
1. Ensure Node.js is installed.
2. Run the build script:
   ```bash
   node scripts/build-seo.js
   ```
This will automatically generate highly optimized static HTML pages into the `/pages/` directory and update the `sitemap.xml`.

---

## 🤝 Contributing

Contributions are always welcome! Since the codebase is pure HTML/JS, it is very accessible. 
If you want to add a new tool:
1. Create a new `.html` file in the `/pages/` directory using an existing tool as a template.
2. Create the corresponding `.js` logic file in the `/js/tools/` directory.
3. Add a link to your new tool in `index.html`.
4. Open a Pull Request!

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
