const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'pages');

// Top 5 Bespoke SEO Content Data
const bespokeContent = {
  'compress.html': {
    h2_1: 'Why Compress PDFs Locally?',
    p_1: 'When dealing with sensitive documents like financial records, legal contracts, or personal IDs, uploading files to a cloud server is a massive security risk. FileForge processes your PDF files entirely within your web browser. This means your data never leaves your device, guaranteeing 100% privacy while drastically reducing file sizes.',
    h2_2: 'How to Reduce PDF Size Without Losing Quality',
    p_2: 'Compressing a PDF is incredibly simple. Just drag and drop your file into the designated area above. You can easily adjust the target size in kilobytes (KB) or megabytes (MB). Our advanced local compression engine will analyze the document and optimize images and embedded fonts to reach your target size while preserving visual fidelity.',
    h2_3: 'Lossless vs Lossy Compression',
    p_3: 'FileForge allows you to balance quality and file size. For most text-heavy documents, you can safely compress the file by over 70% with virtually no noticeable difference in text sharpness. If your document contains high-resolution photos, our engine applies intelligent compression to maintain clarity while shrinking the overall footprint.',
    faqs: [
      { q: 'Are my files uploaded to a server?', a: 'No! All processing is done locally in your browser using WebAssembly. Your files never touch our servers.' },
      { q: 'Will compressing my PDF ruin the images?', a: 'Our intelligent compression algorithm balances file size with visual quality, ensuring your images remain clear and legible.' },
      { q: 'Is there a limit to the file size I can compress?', a: 'Because the processing happens on your own device, the only limit is the available RAM on your computer or phone.' }
    ]
  },
  'remove-background.html': {
    h2_1: 'Free AI Background Removal in Your Browser',
    p_1: 'Removing the background from an image used to require expensive software or cloud-based subscriptions. With FileForge, you can leverage cutting-edge Artificial Intelligence directly in your web browser to erase backgrounds instantly—for free, and without any watermarks.',
    h2_2: 'How Our Offline AI Background Eraser Works',
    p_2: 'When you upload an image, FileForge loads a lightweight AI model directly into your browser\'s memory. This model has been trained to detect subjects—like people, products, or pets—and separate them from their surroundings with pixel-perfect accuracy. Because it runs locally, it is significantly faster than uploading high-res images to a server.',
    h2_3: 'Perfect for E-commerce and Social Media',
    p_3: 'Whether you need a transparent PNG for a product listing, a YouTube thumbnail, or an Instagram post, our tool delivers professional-grade cutouts. The resulting image is saved locally to your device in full resolution.',
    faqs: [
      { q: 'Is the AI processing really done locally?', a: 'Yes! We use WebGL and WebAssembly to run the AI model directly on your device\'s GPU/CPU.' },
      { q: 'Will there be a watermark on my downloaded image?', a: 'Never. FileForge is 100% free and we never add watermarks to your files.' },
      { q: 'Do I need to create an account?', a: 'No sign-ups, no subscriptions, and no email required. Just drop your image and download the result.' }
    ]
  },
  'merge.html': {
    h2_1: 'The Safest Way to Merge PDF Documents',
    p_1: 'Combining multiple PDF files into a single document is a common task, but doing it securely is crucial when handling sensitive work files. FileForge allows you to merge PDFs offline, right in your browser, ensuring that confidential information remains strictly on your device.',
    h2_2: 'How to Combine PDF Files Instantly',
    p_2: 'Simply select the PDF files you want to combine. You can drag and drop them into the workspace above. Once loaded, you can easily drag the files to rearrange their order before hitting the merge button. The entire process takes seconds and requires zero internet upload bandwidth.',
    h2_3: 'Why Browser-Based Processing Beats Cloud Uploads',
    p_3: 'Traditional PDF websites force you to upload your files, wait in a server queue, and then download the merged result. By performing the merge locally, FileForge eliminates upload and download times, making it the fastest and most secure way to manage your documents.',
    faqs: [
      { q: 'Is there a limit to how many PDFs I can merge?', a: 'You can merge as many PDFs as your device\'s memory can handle. There are no artificial limits.' },
      { q: 'Can I rearrange pages before combining them?', a: 'Yes, you can easily drag and drop the files in the preview area to set your desired order before merging.' },
      { q: 'Do I need internet access to merge PDFs?', a: 'Once the FileForge website loads initially, the actual merging process happens offline on your machine.' }
    ]
  },
  'image-to-text.html': {
    h2_1: 'What is Optical Character Recognition (OCR)?',
    p_1: 'Optical Character Recognition (OCR) is a technology that analyzes an image and extracts the readable text from it. FileForge brings this powerful technology directly into your web browser, allowing you to instantly convert screenshots, scanned documents, and photos into editable text.',
    h2_2: 'How to Convert Images to Text for Free',
    p_2: 'Drop any image file (JPG, PNG, WebP) into the tool above. Our local OCR engine will scan the image, identify characters, and reconstruct the text layout. You can then copy the extracted text to your clipboard with a single click, completely bypassing the need to manually transcribe documents.',
    h2_3: 'Why Privacy Matters for OCR Tools',
    p_3: 'People frequently use OCR for sensitive documents like medical records, invoices, or ID cards. Uploading these to cloud-based OCR services is a privacy nightmare. With FileForge, the text extraction happens entirely offline on your device, ensuring zero data leakage.',
    faqs: [
      { q: 'How accurate is the text extraction?', a: 'Our local OCR engine is highly accurate for printed text, especially on clear, high-contrast images.' },
      { q: 'Can I extract text from handwritten notes?', a: 'Handwriting recognition is currently limited, but printed or typed text will yield excellent results.' },
      { q: 'Is my image data kept private?', a: 'Absolutely. The OCR processing happens entirely within your browser, and no images are ever uploaded.' }
    ]
  },
  'password-generator.html': {
    h2_1: 'Why You Should Never Trust Cloud Password Generators',
    p_1: 'Generating a password on a website that communicates with a server is fundamentally insecure. You have no way of knowing if the website is logging the generated passwords and associating them with your IP address. FileForge solves this by generating cryptographic passwords entirely offline.',
    h2_2: 'How Our Browser-Based Generator Guarantees Privacy',
    p_2: 'We use the Web Crypto API built directly into your modern browser to generate truly random numbers. Because FileForge operates locally without server uploads, it is mathematically impossible for us (or anyone else) to intercept or log the passwords you generate.',
    h2_3: 'Best Practices for Creating a Strong Password',
    p_3: 'A secure password should be at least 16 characters long and include a mix of uppercase letters, lowercase letters, numbers, and special symbols. Avoid using predictable patterns or dictionary words. The longer and more complex the password, the harder it is for automated systems to crack.',
    faqs: [
      { q: 'Are the generated passwords saved anywhere?', a: 'No. Passwords are generated on the fly in your browser\'s memory and are destroyed the moment you refresh or leave the page.' },
      { q: 'How long should a secure password be?', a: 'We strongly recommend a minimum of 16 characters for critical accounts like banking or email.' },
      { q: 'Is the generation truly random?', a: 'Yes, we utilize your browser\'s native cryptographic random number generator, which provides cryptographically secure entropy.' }
    ]
  }
};

// Generic fallback template for other pages
function generateGenericContent(title, description) {
  return {
    h2_1: `The Best Way to ${title}`,
    p_1: `FileForge provides the ultimate tool to ${title.toLowerCase()}. Unlike other platforms, our entire suite of tools operates completely locally within your browser. ${description} without ever sacrificing your privacy or waiting for slow server uploads.`,
    h2_2: `How to Use the ${title} Tool`,
    p_2: `Using our tool is incredibly simple. Just drop your files into the designated area above, adjust your settings, and let our browser-based engine do the heavy lifting. The process is instantaneous and requires zero technical expertise.`,
    h2_3: `100% Free and Private`,
    p_3: `We believe that basic file utilities should be free and secure. Because the processing happens on your device, we don't have to pay expensive server costs—which means we can offer this tool completely free of charge, with no ads, no watermarks, and no sign-ups required.`,
    faqs: [
      { q: `Are my files uploaded to a server when using the ${title} tool?`, a: 'No. FileForge processes everything locally on your device, ensuring complete data privacy.' },
      { q: `Is the ${title} tool really free?`, a: 'Yes, all tools on FileForge are 100% free with no hidden limits or watermarks.' },
      { q: `Does this tool work offline?`, a: 'Once the page has loaded in your browser, the tool functions entirely offline without requiring an active internet connection.' }
    ]
  };
}

function generateHTML(content) {
  const faqHtml = content.faqs.map((faq, i) => `
    <div class="faq-item">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-ans-${i}">
        ${faq.q}
      </button>
      <div class="faq-answer" id="faq-ans-${i}">
        <div class="faq-answer-inner">
          ${faq.a}
        </div>
      </div>
    </div>
  `).join('');

  return `
      <!-- SEO ARTICLE INJECTION -->
      <article class="seo-article">
        <h2>${content.h2_1}</h2>
        <p>${content.p_1}</p>
        
        <h2>${content.h2_2}</h2>
        <p>${content.p_2}</p>
        
        <h3>${content.h2_3}</h3>
        <p>${content.p_3}</p>
        
        <div class="faq-section">
          <h2>Frequently Asked Questions</h2>
          ${faqHtml}
        </div>
      </article>
  `;
}

function processFiles() {
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  let count = 0;
  
  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already injected
    if (html.includes('<!-- SEO ARTICLE INJECTION -->')) {
      console.log(`Skipping ${file} (already injected)`);
      continue;
    }
    
    // Extract title and description for fallback
    let titleMatch = html.match(/<title>(.*?) — FileForge<\/title>/);
    let title = titleMatch ? titleMatch[1] : file.replace('.html', '').replace(/-/g, ' ');
    
    let descMatch = html.match(/<meta name="description" content="(.*?)"\/>/);
    let desc = descMatch ? descMatch[1] : 'Manage your files instantly';
    
    // Select content
    let contentData = bespokeContent[file] || generateGenericContent(title, desc);
    let articleHtml = generateHTML(contentData);
    
    // Inject right before closing </main>
    html = html.replace('</main>', `\n${articleHtml}\n  </main>`);
    
    // Also inject the interactive FAQ script right before closing </body>
    const faqScript = `
  <script>
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        const content = btn.nextElementSibling;
        if (!expanded) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0';
        }
      });
    });
  </script>
`;
    html = html.replace('</body>', `${faqScript}</body>`);
    
    fs.writeFileSync(filePath, html);
    console.log(`Injected SEO content into ${file}`);
    count++;
  }
  
  console.log(`\nSuccessfully injected SEO content into ${count} files.`);
}

processFiles();
