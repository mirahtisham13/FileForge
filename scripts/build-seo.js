const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../pages');
const SITE_ROOT = path.join(__dirname, '../');

const configs = [
  // PDF Compression Cluster
  ...[50, 100, 200, 300, 400, 500].map(size => ({
    template: 'compress.html',
    slug: `compress-pdf-to-${size}kb.html`,
    title: `Compress PDF to ${size}KB Online (Free & Private) | FileForge`,
    desc: `Reduce your PDF file size to ${size}KB or less instantly. Perfect for job applications and portal uploads. 100% free, private browser tool.`,
    h1: `Compress PDF to ${size}KB Instantly`,
    subtitle: `Force your PDF file size down to exactly ${size}KB without losing readability.`,
    prefillScript: `
      document.getElementById('targetSize').value = '${size}';
      document.getElementById('targetUnit').value = 'kb';
      document.getElementById('targetSize').style.borderColor = '#10b981';
    `,
    seoHtml: `
      <section class="seo-article" style="margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border);">
        <h2>Why compress a PDF to exactly ${size}KB?</h2>
        <p>Many government portals, university application systems, and corporate job boards have strict file size limits. A common requirement is that uploaded documents must be strictly under ${size}KB. If your scanned document or resume exceeds this limit, the system will reject your upload.</p>
        <p>FileForge's local compression engine allows you to mathematically target a specific file size. By entering <strong>${size}KB</strong> into the target box, our algorithm adjusts the internal image DPI and compression quality until the final output file guarantees compliance with the ${size}KB limit.</p>
        
        <h2>How to Compress your PDF to ${size}KB Without Losing Quality</h2>
        <ol>
          <li>Drag and drop your PDF file into the drop zone above.</li>
          <li>Our tool has automatically pre-filled the target size to <strong>${size} KB</strong>.</li>
          <li>Click the compression button.</li>
          <li>The file will be reduced entirely in your browser without being uploaded to any server, ensuring total privacy.</li>
        </ol>
        
        <h2>Is my data safe?</h2>
        <p>Yes. Unlike traditional PDF compressors that require you to upload your sensitive tax documents, ID cards, or resumes to a remote cloud server, FileForge processes the entire file offline using WebAssembly. Your file never leaves your device.</p>
      </section>
    `
  })),

  // JPEG Compression Cluster
  ...[50, 100, 200].map(size => ({
    template: 'compress-image.html',
    slug: `compress-jpeg-to-${size}kb.html`,
    title: `Compress JPEG to ${size}KB Online (Free & Private) | FileForge`,
    desc: `Reduce your JPEG/JPG image size to ${size}KB instantly. Perfect for profile pictures and web uploads. 100% free offline tool.`,
    h1: `Compress JPEG to ${size}KB Instantly`,
    subtitle: `Shrink your image file size to exactly ${size}KB with minimal quality loss.`,
    prefillScript: `
      const ts = document.getElementById('targetSize');
      if (ts) {
        ts.value = '${size}';
        const tu = document.getElementById('targetUnit');
        if (tu) tu.value = 'kb';
        ts.style.borderColor = '#10b981';
      }
    `,
    seoHtml: `
      <section class="seo-article" style="margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border);">
        <h2>Why do you need a ${size}KB JPEG?</h2>
        <p>Many online platforms, forums, and passport application portals require profile pictures and uploaded images to be strictly under ${size}KB. Compressing a high-resolution smartphone photo down to ${size}KB can be difficult without the right tools.</p>
        <p>FileForge makes it incredibly easy by allowing you to specify <strong>${size}KB</strong> as your exact target size. Our algorithm dynamically adjusts the JPEG quality factor to match your requirement.</p>
        
        <h2>How our ${size}KB Image Compressor works</h2>
        <p>When you drop an image into the tool, FileForge uses your device's local CPU to re-encode the image. We automatically downscale the image dimensions and apply a custom compression ratio until the output file fits under the ${size}KB limit.</p>
        
        <h2>Total Privacy</h2>
        <p>Because the compression happens in your web browser, you don't need to worry about uploading personal photos to a third-party server. It is 100% private and instantaneous.</p>
      </section>
    `
  })),

  // PNG Compression Cluster
  ...[50, 100].map(size => ({
    template: 'compress-image.html',
    slug: `compress-png-to-${size}kb.html`,
    title: `Compress PNG to ${size}KB Online (Free & Private) | FileForge`,
    desc: `Reduce your PNG image size to ${size}KB instantly. Retain transparency while shrinking the file size. 100% free offline tool.`,
    h1: `Compress PNG to ${size}KB Instantly`,
    subtitle: `Shrink your PNG file size to exactly ${size}KB while retaining transparency.`,
    prefillScript: `
      const ts = document.getElementById('targetSize');
      if (ts) {
        ts.value = '${size}';
        const tu = document.getElementById('targetUnit');
        if (tu) tu.value = 'kb';
        ts.style.borderColor = '#10b981';
      }
    `,
    seoHtml: `
      <section class="seo-article" style="margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border);">
        <h2>Shrinking PNGs to ${size}KB</h2>
        <p>PNG images are typically much larger than JPEGs because they use lossless compression and support transparency. However, if you need a PNG to fit under a ${size}KB limit for a website or application, you need a smart compressor.</p>
        <p>FileForge compresses your PNG down to ${size}KB by intelligently converting it to an optimized format like WebP or by applying lossy compression algorithms that preserve the alpha channel (transparency) while drastically reducing the file size.</p>
        <p>Like all FileForge tools, this happens entirely offline for maximum privacy.</p>
      </section>
    `
  })),

  // Conversion Cluster
  {
    template: 'images-to-pdf.html',
    slug: 'merge-jpg-to-pdf.html',
    title: 'Merge JPG to PDF Online (Free & Private) | FileForge',
    desc: 'Combine multiple JPG/JPEG images into a single PDF document. 100% free, no uploads, secure browser-based processing.',
    h1: 'Merge JPG to PDF',
    subtitle: 'Combine your JPG photos into a single PDF document instantly.',
    prefillScript: '', // No prefill needed
    seoHtml: `
      <section class="seo-article" style="margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border);">
        <h2>How to Merge JPGs into a PDF</h2>
        <p>If you have multiple scanned JPG images, receipts, or photos, the best way to share them is by merging them into a single PDF file. PDFs are universally compatible and ensure your images are viewed in the correct order.</p>
        <ol>
          <li>Drag and drop your JPG files into the tool above.</li>
          <li>Rearrange the images by dragging them into the desired order.</li>
          <li>Click "Generate PDF" to merge them.</li>
        </ol>
        <h2>Secure Offline Processing</h2>
        <p>Most online JPG to PDF converters require you to upload your personal photos to their servers. FileForge processes the JPGs and generates the PDF entirely locally in your web browser. Your images are never uploaded.</p>
      </section>
    `
  }
];

// Execute Generation
let generatedPages = [];

configs.forEach(config => {
  const templatePath = path.join(PAGES_DIR, config.template);
  if (!fs.existsSync(templatePath)) {
    console.warn(`Template not found: ${templatePath}`);
    return;
  }

  let html = fs.readFileSync(templatePath, 'utf8');

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${config.title}</title>`);
  
  // Replace Meta Description
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${config.desc}">`);
  
  // Replace H1
  html = html.replace(/<h1 class="tool-page-title">.*?<\/h1>/, `<h1 class="tool-page-title">${config.h1}</h1>`);
  
  // Replace Subtitle
  html = html.replace(/<p class="tool-page-subtitle">.*?<\/p>/, `<p class="tool-page-subtitle">${config.subtitle}</p>`);

  // Remove any existing <article class="seo-article">...</article>
  // This is tricky with regex because it spans multiple lines.
  // We can use [\s\S]*? to match the article.
  html = html.replace(/<article class="seo-article">[\s\S]*?<\/article>/g, '');
  // Also remove any other injected seo-article sections just in case
  html = html.replace(/<section class="seo-article"[\s\S]*?<\/section>/g, '');

  // Inject SEO Article right before </main>
  if (config.seoHtml) {
    const idx = html.lastIndexOf('</main>');
    if (idx !== -1) {
      const injection = `\n    <div class="container">\n      ${config.seoHtml}\n    </div>\n  `;
      html = html.slice(0, idx) + injection + html.slice(idx);
    }
  }

  // Inject Prefill Script before </body>
  if (config.prefillScript) {
    const scriptTag = `\n  <script>\n    window.addEventListener('DOMContentLoaded', () => {\n      ${config.prefillScript}\n    });\n  </script>\n`;
    html = html.replace(/<\/body>/, `${scriptTag}</body>`);
  }

  // Add canonical link to the base tool if needed, or self-referential
  const canonical = `<link rel="canonical" href="https://fileforge.app/pages/${config.slug}" />`;
  html = html.replace(/<\/head>/, `  ${canonical}\n</head>`);

  // Write the file
  const outputPath = path.join(PAGES_DIR, config.slug);
  fs.writeFileSync(outputPath, html);
  generatedPages.push(config.slug);
  console.log(`Generated: ${config.slug}`);
});

// Generate Sitemap
const SITEMAP_PATH = path.join(SITE_ROOT, 'sitemap.xml');
const BASE_URL = 'https://fileforge.app'; // Assuming a domain

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// Add index
sitemap += `  <url>\n    <loc>${BASE_URL}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

// Read all HTML files in pages/
const allPages = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));

allPages.forEach(page => {
  const isPseo = generatedPages.includes(page);
  const priority = isPseo ? '0.6' : '0.8';
  sitemap += `  <url>\n    <loc>${BASE_URL}/pages/${page}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
});

sitemap += `</urlset>`;
fs.writeFileSync(SITEMAP_PATH, sitemap);
console.log(`Generated sitemap.xml with ${allPages.length + 1} URLs.`);

// Create robots.txt
const ROBOTS_PATH = path.join(SITE_ROOT, 'robots.txt');
const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
fs.writeFileSync(ROBOTS_PATH, robotsContent);
console.log(`Generated robots.txt`);
