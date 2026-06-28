const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'pages');

// Top Bespoke SEO Content Data
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
  },
  'split.html': {
    h2_1: 'Secure PDF Splitting Without the Cloud',
    p_1: 'Splitting large PDFs into smaller, manageable chunks is essential when dealing with extensive reports, legal documents, or e-books. With FileForge, you can extract specific pages or divide a PDF completely offline, ensuring your confidential documents remain strictly on your device.',
    h2_2: 'How to Extract Pages from a PDF',
    p_2: 'To extract specific pages, upload your document and select the "Extract page range" mode. You can enter comma-separated values like "1, 3, 5-10" to pull out only the exact pages you need. The tool instantly generates a new, smaller PDF containing only your selected pages.',
    h2_3: 'Instant Browser-Based Processing',
    p_3: 'Waiting for massive PDFs to upload to a remote server, process, and download again can take minutes. Because FileForge processes the split directly in your browser using WebAssembly, the entire operation happens in milliseconds, regardless of your internet speed.',
    faqs: [
      { q: 'Can I split a PDF into individual pages?', a: 'Yes, simply select the "Split into individual pages" mode and FileForge will export a ZIP file containing every page as a standalone PDF.' },
      { q: 'Is my original PDF altered?', a: 'No, the original PDF on your device remains completely untouched. We generate a brand new file for the extracted pages.' },
      { q: 'Does this work for password-protected PDFs?', a: 'If a PDF is encrypted, you must unlock it first before our tool can extract or split the pages.' }
    ]
  },
  'pdf-to-word.html': {
    h2_1: 'Convert PDF to Word Locally',
    p_1: 'Converting a PDF back into an editable Word Document (DOCX) is notoriously difficult. FileForge provides a privacy-first solution that extracts the text and structural elements from your PDF and reconstructs them into a Microsoft Word-compatible file directly inside your browser.',
    h2_2: 'How to Make a PDF Editable',
    p_2: 'Drop your PDF into the designated area. Our client-side conversion engine parses the internal PDF syntax, identifies text blocks, and writes a new DOCX file. The resulting file can be opened seamlessly in Microsoft Word, Google Docs, or Apple Pages for immediate editing.',
    h2_3: 'Why Offline Conversion is Superior',
    p_3: 'Most online PDF to Word converters are massive security liabilities, requiring you to hand over potentially sensitive business contracts to a third party. FileForge completely eliminates this risk by converting the document locally on your own computer.',
    faqs: [
      { q: 'Will the Word document look exactly like the PDF?', a: 'We strive to maintain the layout as accurately as possible, but complex elements like layered vectors or absolute positioning may require minor manual adjustments.' },
      { q: 'Can I convert a scanned PDF to Word?', a: 'Currently, the converter works best with native text PDFs. Scanned images embedded in PDFs will require our OCR tool first.' },
      { q: 'Is there a limit on how many pages I can convert?', a: 'Because the conversion runs on your device, you are only limited by your browser\'s memory. There are no paywalls for large documents.' }
    ]
  },
  'extract-pdf.html': {
    h2_1: 'Extract Specific Pages from a PDF',
    p_1: 'Sometimes you don\'t need an entire 100-page report; you just need the executive summary on page 4. FileForge\'s PDF Extraction tool allows you to instantly slice out the specific pages you need and save them as a brand new, highly portable PDF.',
    h2_2: 'How to Isolate PDF Pages',
    p_2: 'Load your document into the tool and specify the pages you want to extract. You can use standard range notation (like "4-7, 12, 15"). The tool will instantly parse the PDF binary, discard the unneeded pages, and assemble a new document right before your eyes.',
    h2_3: '100% Privacy Guaranteed',
    p_3: 'Extracting pages often involves financial statements or sensitive legal documents. By running the entire extraction process natively in your web browser, FileForge guarantees that your data is never intercepted or stored on an external server.',
    faqs: [
      { q: 'Are the extracted pages compressed?', a: 'The extracted pages maintain the exact same quality and resolution as the original source PDF.' },
      { q: 'Can I extract pages from multiple PDFs at once?', a: 'Currently, you must extract pages from one PDF at a time, but you can use our Merge tool afterward to combine them.' },
      { q: 'How fast is the extraction process?', a: 'Because no internet upload is required, extraction is virtually instantaneous.' }
    ]
  },
  'crop-pdf.html': {
    h2_1: 'Crop PDF Pages Automatically',
    p_1: 'Removing excessive white margins or isolating a specific graphic inside a PDF is incredibly useful for presentation and printing. FileForge allows you to visually crop your PDF documents directly in the browser, completely for free.',
    h2_2: 'How to Remove Margins from a PDF',
    p_2: 'Upload your PDF and use our visual bounding box to define the new crop area. You can apply this crop specifically to the current page, or apply it globally to every page in the document simultaneously. Hit crop, and the browser will redefine the internal MediaBox and CropBox of the PDF.',
    h2_3: 'Total Data Security',
    p_3: 'Like all tools in the FileForge suite, the cropping engine runs entirely on your local machine using WebAssembly. This ensures blistering fast performance and total peace of mind when handling confidential documents.',
    faqs: [
      { q: 'Does cropping reduce the file size?', a: 'Cropping only hides the content outside the bounding box; it does not necessarily delete the underlying data, so file size may remain similar.' },
      { q: 'Can I undo a crop?', a: 'Your original file is never altered. If you make a mistake, simply reload the file and try again.' },
      { q: 'Is this tool free?', a: 'Yes, FileForge offers unlimited local PDF cropping completely free of charge.' }
    ]
  },
  'unlock-pdf.html': {
    h2_1: 'Remove PDF Passwords Instantly',
    p_1: 'If you have the password to a secured PDF but are tired of typing it in every time you open the document, you need a PDF unlocker. FileForge allows you to permanently strip the encryption from your document locally, creating a brand new, unprotected file.',
    h2_2: 'How to Remove PDF Encryption',
    p_2: 'Upload your locked PDF and enter the correct password when prompted. Our local decryption engine will use the password to decrypt the AES/RC4 cipher, parse the document structure, and rewrite the PDF completely unencrypted for easy future access.',
    h2_3: 'Why Local Decryption is Crucial',
    p_3: 'Uploading an encrypted PDF along with its password to a third-party server completely defeats the purpose of securing the document in the first place. FileForge performs the decryption securely on your device, ensuring your password is never transmitted across the internet.',
    faqs: [
      { q: 'Can this tool crack a PDF password I forgot?', a: 'No. FileForge requires the correct user password to decrypt the file. It is not a password cracking tool.' },
      { q: 'Is the new file permanently unlocked?', a: 'Yes. The output file generated by our tool will have all security and password restrictions permanently removed.' },
      { q: 'Are owner restrictions removed?', a: 'Yes, once the document is successfully decrypted, restrictions on printing or copying are also lifted.' }
    ]
  },
  'protect-pdf.html': {
    h2_1: 'Secure Your PDFs with AES Encryption',
    p_1: 'When sending sensitive documents via email or storing them on shared drives, you must ensure they cannot be opened by unauthorized parties. FileForge allows you to encrypt your PDFs with military-grade AES encryption directly in your web browser.',
    h2_2: 'How to Password Protect a PDF',
    p_2: 'Drop your PDF into the tool and define a strong password. Our cryptographic engine will rewrite the file, encrypting the internal streams and objects. Once encrypted, the file will be completely unreadable to anyone who does not possess the exact password.',
    h2_3: 'Zero-Knowledge Security',
    p_3: 'Because the encryption happens locally on your device using the Web Crypto API, FileForge operates on a zero-knowledge basis. We never see your document, and we never see the password you use to secure it. It is the ultimate privacy solution.',
    faqs: [
      { q: 'What type of encryption is used?', a: 'We utilize standard 128-bit or 256-bit AES encryption, which is compatible with all modern PDF readers like Adobe Acrobat.' },
      { q: 'Can FileForge recover my password if I forget it?', a: 'No. Because the encryption happens on your device and we do not store your passwords, a forgotten password cannot be recovered.' },
      { q: 'Does adding a password increase the file size?', a: 'Encryption adds a negligible amount of overhead (a few kilobytes at most), so your file size remains practically identical.' }
    ]
  },
  'images-to-pdf.html': {
    h2_1: 'Convert Images to a Single PDF',
    p_1: 'If you have multiple scanned JPGs, PNGs, or receipts, the best way to share them is by packaging them into a single PDF document. PDFs are universally compatible, print-friendly, and ensure your images are viewed in the exact order you intended.',
    h2_2: 'How to Combine Photos into a PDF',
    p_2: 'Drag and drop your images into the workspace. You can easily rearrange them by dragging the thumbnails. Our engine will dynamically generate a PDF document, placing each image on a separate page perfectly scaled to fit the document bounds.',
    h2_3: '100% Offline Image Processing',
    p_3: 'Most image-to-pdf websites require you to upload your personal photos, which is a massive privacy concern. FileForge processes your images locally. It scales, compresses, and embeds them into the PDF structure entirely within your browser\'s memory.',
    faqs: [
      { q: 'Which image formats are supported?', a: 'You can combine JPG, PNG, WebP, and BMP images into a single PDF document.' },
      { q: 'Are the images compressed during conversion?', a: 'By default, we preserve the original image quality, but you can use our PDF compressor afterward if the resulting file is too large.' },
      { q: 'Is there a limit to how many images I can add?', a: 'You can add as many images as your device can handle in its local memory.' }
    ]
  },
  'crop-image.html': {
    h2_1: 'Free Browser-Based Image Cropper',
    p_1: 'Whether you need to frame a subject perfectly for an Instagram post, or cut out unnecessary background details from a photograph, our image cropper provides a fast, intuitive, and entirely local solution.',
    h2_2: 'How to Crop Photos Online',
    p_2: 'Upload your image and use the interactive bounding box to define your crop. You can select predefined aspect ratios (like 1:1 for profile pictures, or 16:9 for YouTube thumbnails) or crop freely. Once you click crop, the browser processes the pixels and outputs the new image instantly.',
    h2_3: 'Secure and Private',
    p_3: 'Unlike other online photo editors that upload your personal pictures to their servers for processing, FileForge performs the crop operation locally on your device using HTML5 Canvas. Your photos never leave your machine.',
    faqs: [
      { q: 'Does cropping reduce the image quality?', a: 'No, cropping simply discards the pixels outside the bounding box. The remaining pixels are preserved at their original quality.' },
      { q: 'What formats can I crop?', a: 'You can crop JPG, PNG, WebP, and BMP files with full support for transparency.' },
      { q: 'Can I crop an image into a circle?', a: 'Currently, the tool exports standard rectangular crops, though you can use CSS border-radius on your own website to make it circular.' }
    ]
  },
  'resize-image.html': {
    h2_1: 'Resize Images for Web and Print',
    p_1: 'Resizing an image to specific dimensions is often required for website headers, social media uploads, or printing. FileForge allows you to scale your images up or down instantly while maintaining the original aspect ratio to prevent distortion.',
    h2_2: 'How to Change Image Dimensions',
    p_2: 'Simply drop your image into the tool and specify your desired width or height in pixels. If you lock the aspect ratio, the tool will automatically calculate the other dimension to ensure your image doesn\'t stretch. Click resize, and download the new file.',
    h2_3: 'Fast Local Processing',
    p_3: 'Resizing large high-resolution photos on a cloud server takes time due to upload speeds. Because FileForge resizes the image locally using your device\'s GPU and CPU, the process is instantaneous and requires zero data usage.',
    faqs: [
      { q: 'Will resizing make my image blurry?', a: 'Scaling an image down (shrinking) usually retains sharpness. Scaling an image up (enlarging) beyond its original resolution will inevitably result in some blurriness or pixelation.' },
      { q: 'Can I resize multiple images at once?', a: 'Currently, the tool is optimized for single-image resizing to ensure the highest quality output.' },
      { q: 'Is my data secure?', a: 'Yes! All resizing happens entirely within your browser window. No files are uploaded.' }
    ]
  },
  'convert-image.html': {
    h2_1: 'Universal Local Image Converter',
    p_1: 'Converting images between formats like WebP, PNG, and JPG is a common necessity for web developers and designers. FileForge provides a blazing-fast, secure, and privacy-focused conversion engine that operates completely within your browser.',
    h2_2: 'How to Convert Image Formats',
    p_2: 'Upload your source image and select your desired output format from the dropdown menu. Our tool decodes the image locally and re-encodes it into the new format. This allows you to easily strip backgrounds by converting to JPG, or add modern compression by converting to WebP.',
    h2_3: 'Why WebP is the Future',
    p_3: 'We highly recommend converting bulky JPGs and PNGs to WebP. WebP is a modern image format that provides superior lossless and lossy compression for images on the web, often reducing file sizes by 30-50% compared to traditional formats without sacrificing quality.',
    faqs: [
      { q: 'Are my images uploaded to convert them?', a: 'No, all decoding and encoding happens on your local device. Your images are never transmitted over the internet.' },
      { q: 'Do I lose transparency when converting to JPG?', a: 'Yes, the JPG format does not support transparency. Any transparent areas will be filled with a solid color (usually white) during conversion.' },
      { q: 'Is there a file size limit?', a: 'No, you are only limited by your device\'s local memory and processing power.' }
    ]
  },
  'qr-generator.html': {
    h2_1: 'Create Custom QR Codes Instantly',
    p_1: 'QR codes are the perfect bridge between the physical and digital worlds, allowing users to scan a code and instantly visit a website, connect to WiFi, or view a menu. FileForge offers a free, high-resolution QR code generator that runs entirely in your browser.',
    h2_2: 'How to Generate a QR Code',
    p_2: 'Simply type or paste your URL, text, or contact information into the input field. As you type, the QR code is generated in real-time. You can customize the colors, add a central logo, and adjust the error correction level to ensure it scans perfectly every time.',
    h2_3: 'No Tracking, No Expiring Links',
    p_3: 'Many online QR generators create "Dynamic" QR codes that route through their servers to track analytics, and eventually expire if you don\'t pay a subscription. FileForge generates purely static QR codes. They never expire, they never track you, and they are completely free forever.',
    faqs: [
      { q: 'Will my QR code ever expire?', a: 'Never. Our QR codes encode your exact text or URL directly. They do not rely on our servers, so they work forever.' },
      { q: 'Can I use the generated QR code for commercial purposes?', a: 'Absolutely! You can use them on menus, billboards, business cards, and product packaging completely free of charge.' },
      { q: 'What is error correction?', a: 'Error correction allows the QR code to be scanned even if part of it is damaged or covered (like when adding a custom logo to the center).' }
    ]
  },
  'zip-creator.html': {
    h2_1: 'Compress Files into a ZIP Archive',
    p_1: 'When you need to email multiple documents or organize a folder of photos, compressing them into a single ZIP file is the universal standard. FileForge provides a powerful, browser-based archiving tool that bundles your files together securely.',
    h2_2: 'How to Create a ZIP File Online',
    p_2: 'Drag and drop all the files you wish to compress into the workspace. Our local engine will read the files, apply DEFLATE compression algorithms to reduce their overall size, and package them into a standard `.zip` archive that you can download instantly.',
    h2_3: 'Maximum Privacy for Archiving',
    p_3: 'Archiving personal files on a remote server is highly insecure. Because FileForge uses a local WebAssembly port to generate the ZIP file, your documents, photos, and videos never leave your hard drive. It is the safest way to create archives.',
    faqs: [
      { q: 'Does creating a ZIP reduce file sizes?', a: 'Yes, the ZIP format applies lossless compression. Text files and documents will shrink significantly, though already-compressed files like JPEGs may only shrink slightly.' },
      { q: 'Is there a limit to how many files I can ZIP?', a: 'There are no hard limits, but since it runs in your browser, zipping gigabytes of data may require a computer with substantial RAM.' },
      { q: 'Are my files uploaded?', a: 'No, the entire ZIP creation process happens locally on your device for absolute privacy.' }
    ]
  }
};

// Generic fallback template for other pages
function generateGenericContent(title, description) {
  // Fix lowercase titles like "split" -> "Split PDFs"
  let cleanTitle = title.trim();
  if (cleanTitle === cleanTitle.toLowerCase()) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    if (!cleanTitle.includes(' ')) {
      cleanTitle += ' PDFs'; // A good default assumption
    }
  }

  return {
    h2_1: `The Best Way to ${cleanTitle}`,
    p_1: `FileForge provides the ultimate tool to ${title.toLowerCase()}. Unlike other platforms, our entire suite of tools operates completely locally within your browser. ${description} without ever sacrificing your privacy or waiting for slow server uploads.`,
    h2_2: `How to Use the ${cleanTitle} Tool`,
    p_2: `Using our tool is incredibly simple. Just drop your files into the designated area above, adjust your settings, and let our browser-based engine do the heavy lifting. The process is instantaneous and requires zero technical expertise.`,
    h2_3: `100% Free and Private`,
    p_3: `We believe that basic file utilities should be free and secure. Because the processing happens on your device, we don't have to pay expensive server costs—which means we can offer this tool completely free of charge, with no ads, no watermarks, and no sign-ups required.`,
    faqs: [
      { q: `Are my files uploaded to a server when using this tool?`, a: 'No. FileForge processes everything locally on your device, ensuring complete data privacy.' },
      { q: `Is the ${cleanTitle} tool really free?`, a: 'Yes, all tools on FileForge are 100% free with no hidden limits or watermarks.' },
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
    
    // First, strip out the old SEO block and interactive FAQ script completely
    // We use a regex to capture everything from <!-- SEO ARTICLE INJECTION --> to </article>
    html = html.replace(/\s*<!-- SEO ARTICLE INJECTION -->[\s\S]*?<\/article>\s*/, '');
    
    // We also need to strip out the old script injection at the bottom of the body
    html = html.replace(/\s*<script>\s*document\.querySelectorAll\('\.faq-question'\)[\s\S]*?<\/script>\s*<\/body>/, '\n</body>');
    
    // Extract title and description for fallback
    let titleMatch = html.match(/<title>(.*?) — .*?<\/title>/) || html.match(/<title>(.*?) - .*?<\/title>/) || html.match(/<title>(.*?) \| .*?<\/title>/);
    let title = titleMatch ? titleMatch[1] : file.replace('.html', '').replace(/-/g, ' ');
    
    let descMatch = html.match(/<meta name="description" content="(.*?)"/);
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
    console.log(`Injected bespoke/fallback SEO content into ${file}`);
    count++;
  }
  
  console.log(`\nSuccessfully injected/updated SEO content in ${count} files.`);
}

processFiles();
