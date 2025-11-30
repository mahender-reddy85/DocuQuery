// Define displayStatus globally first, as it's needed by both the module and switchScreen
window.displayStatus = function(message, type = 'warning') {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    // Base classes for the status box
    statusMessage.className = 'mt-2 p-3 text-sm rounded-lg border';

    if (type === 'error') {
        // Light mode classes
        statusMessage.classList.add('text-red-700', 'bg-red-50', 'border-red-200');
        // Dark mode classes
        statusMessage.classList.add('dark:text-red-300', 'dark:bg-red-900/50', 'dark:border-red-800');
    } else if (type === 'success') {
        // Light mode classes
        statusMessage.classList.add('text-green-700', 'bg-green-50', 'border-green-200');
        // Dark mode classes
        statusMessage.classList.add('dark:text-green-300', 'dark:bg-green-900/50', 'dark:border-green-800');
    } else { // Warning (e.g., Awaiting file upload)
        // Light mode classes
        statusMessage.classList.add('text-yellow-700', 'bg-yellow-50', 'border-yellow-200');
        // Dark mode classes
        statusMessage.classList.add('dark:text-yellow-300', 'dark:bg-yellow-900/50', 'dark:border-yellow-800');
    }
    statusMessage.classList.remove('hidden');
};

// Global utility function, accessible from HTML onclick attributes
window.switchScreen = function(targetId) {
    // Get necessary elements inside the global function
    const initialScreen = document.getElementById('initialScreen');
    const qaScreen = document.getElementById('qaScreen');
    const documentFileName = document.getElementById('documentFileName');
    const extractedTextDisplay = document.getElementById('extractedTextDisplay');
    const brandingContainer = document.getElementById('brandingContainer'); // Branding element
    const mainHeader = document.getElementById('mainHeader'); // Header element
    const dropZoneStatus = document.getElementById('dropZoneStatus');

    if (targetId === 'initialScreen') {
        qaScreen.classList.add('hidden');
        initialScreen.classList.remove('hidden');

        // Restore header positioning for centered screen
        mainHeader.classList.add('absolute', 'top-0', 'left-0', 'right-0');
        mainHeader.classList.remove('relative', 'mb-6');

        brandingContainer.classList.remove('hidden'); // Show branding

        // FIX: Clear the drop zone status message when returning to initial screen
        if (dropZoneStatus) {
            dropZoneStatus.textContent = '';
            dropZoneStatus.classList.add('hidden');
        }

        // Clear state when returning to upload screen
        documentFileName.textContent = '';
        extractedTextDisplay.innerHTML = '<p class="text-gray-400 italic">Extracted text will appear here.</p>';
        toggleChatInputs(false);
        window.displayStatus('Awaiting file upload (PDF, DOCX, TXT, or PPTX).', 'warning');
    } else {
        initialScreen.classList.add('hidden');
        qaScreen.classList.remove('hidden');

        // Adjust header positioning for QA screen
        mainHeader.classList.remove('absolute', 'top-0', 'left-0', 'right-0');
        mainHeader.classList.add('relative', 'mb-6');

        brandingContainer.classList.add('hidden'); // Hide branding
    }
};

// --- 1. CONFIGURATION AND IMPORTS ---

// Gemini API Configuration
// SECURITY: Do NOT store API keys in client-side code. The frontend will call
// a local server-side proxy at `/api/generate` which must securely hold the
// actual API key in an environment variable (see server.js and README.md).
const MODEL = 'gemini-2.0-flash';
const API_ENDPOINT = '/api/generate'; // local proxy endpoint

// Global variables (now scoped within the module)
let extractedText = null;
// Element variables (will be assigned in setupEventListeners)
let fileInputHidden, dropZone, dropZoneStatus, initialScreen, qaScreen, documentFileName;
let questionForm, questionInput, submitQuestionButton, chatHistory, extractedTextDisplay;
let loadingIndicator, statusMessage, chatLoading, sendIcon;
let themeToggle, sunIcon, moonIcon;


// Client-side Library Imports (via CDN)
let getDocument;
let mammoth; // Tesseract removed

// --- 2. UTILITY FUNCTIONS ---

/**
 * Applies the theme classes and icons.
 * @param {boolean} isDark
 */
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        document.body.classList.remove('dark');
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme === 'dark');
}

/**
 * Displays a status message in the drop zone area.
 * @param {string} message
 * @param {'error' | 'processing' | 'hidden'} type
 */
function displayDropZoneStatus(message, type) {
    dropZoneStatus.textContent = message;
    // Clear all color and visibility classes first
    dropZoneStatus.classList.remove('hidden', 'text-blue-500', 'text-red-500', 'dark:text-blue-300', 'dark:text-red-300');

    if (type === 'processing') {
        // Processing status colors
        dropZoneStatus.classList.add('text-blue-500', 'dark:text-blue-300');
    } else if (type === 'error') {
        // Error status colors
        dropZoneStatus.classList.add('text-red-500', 'dark:text-red-300');
    } else { // 'hidden' or standard
        dropZoneStatus.classList.add('hidden');
        return;
    }
    dropZoneStatus.classList.remove('hidden');
}


/**
 * Generic fetch wrapper with exponential backoff for retries.
 */
async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status !== 429 && response.status < 500) {
                return response; // Success or non-retryable error
            }
            // If 429 (Too Many Requests) or 5xx, retry with delay
            console.log(`[Retry] Request failed with status ${response.status}. Retrying in ${Math.pow(2, i)}s...`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        } catch (error) {
            if (i === maxRetries - 1) throw error; // Re-throw on last attempt
            console.log(`[Retry] Request failed with error: ${error.message}. Retrying in ${Math.pow(2, i)}s...`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    throw new Error("API request failed after multiple retries.");
}

/**
 * Converts a File or Blob into an ArrayBuffer.
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Scrolls the chat history to the bottom.
 */
function scrollChatToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

/**
 * Adds a message to the chat history.
 */
function addChatMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('max-w-[85%]', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageDiv.classList.add('user-query', 'self-end');
    } else {
        messageDiv.classList.add('ai-response', 'self-start'); // Dark mode is applied via CSS hook
    }
    messageDiv.innerHTML = text.replace(/\n/g, '<br>'); // Preserve line breaks

    chatHistory.appendChild(messageDiv);
    scrollChatToBottom();
}

/**
 * Toggles the loading state for the Q&A section.
 */
function toggleChatLoading(isLoading) {
    questionInput.disabled = isLoading;
    submitQuestionButton.disabled = isLoading;
    chatLoading.classList.toggle('hidden', !isLoading);
    sendIcon.classList.toggle('hidden', isLoading);
    if (isLoading) {
        // Add a temporary AI placeholder
        const placeholder = document.createElement('div');
        placeholder.id = 'aiPlaceholder';
        placeholder.classList.add('ai-response', 'self-start');
        placeholder.innerHTML = 'Thinking...';
        chatHistory.appendChild(placeholder);
        scrollChatToBottom();
    } else {
        // Remove placeholder
        const placeholder = document.getElementById('aiPlaceholder');
        if (placeholder) placeholder.remove();
    }
}

/**
 * Enables/Disables the chat input section.
 */
function toggleChatInputs(enable) {
    questionInput.disabled = !enable;
    submitQuestionButton.disabled = !enable;
}

/**
 * Toggles the main file extraction loading state.
 */
function toggleFileLoading(isLoading) {
    loadingIndicator.classList.toggle('hidden', !isLoading);
}

// --- 3. EXTRACTION FUNCTIONS ---

/**
 * Extracts text from a DOCX file using mammoth.js.
 */
async function extractDocxText(file) {
    if (!mammoth) throw new Error("mammoth.js not loaded.");
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

/**
 * Extracts text from a PDF file using pdf.js.
 */
async function extractPdfText(file) {
    if (!getDocument) throw new Error("PDF.js getDocument not initialized.");
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
    }
    return fullText.trim();
}

/**
 * Handles the main file upload and calls the correct extractor.
 * @param {File} file - The file object to process.
 */
async function processFile(file) {
    // Check for unsupported files first (PPTX is in UI but not implemented)
    if (file.name.endsWith('.pptx') || file.type.includes('officedocument.presentationml')) {
         displayDropZoneStatus(`PPTX files are currently not supported for extraction. Please use PDF, DOCX, or TXT.`, 'error');
         return;
    }

    // Reset UI states
    toggleFileLoading(true);
    displayDropZoneStatus(`Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`, 'processing');
    extractedTextDisplay.textContent = 'Processing...';

    const mimeType = file.type;
    let extractedContent = '';
    let fileType = 'Unknown';

    try {
        if (mimeType === 'application/pdf') {
            fileType = 'PDF';
            extractedContent = await extractPdfText(file);
        } else if (mimeType.includes('officedocument.wordprocessingml') || file.name.endsWith('.docx')) {
            fileType = 'DOCX';
            extractedContent = await extractDocxText(file);
        } else if (mimeType.startsWith('text/') || file.name.endsWith('.txt')) {
            fileType = 'TXT';
            extractedContent = await file.text();
        } else {
            // Removed image handling
            throw new Error(`Unsupported file type: ${mimeType}. Please use PDF, DOCX, or TXT.`);
        }

        if (!extractedContent || extractedContent.trim().length === 0) {
            extractedText = null;
            extractedTextDisplay.textContent = 'No text could be extracted from this file.';
            displayDropZoneStatus(`Extraction failed: No readable text found in ${fileType}.`, 'error');
            toggleChatInputs(false);
        } else {
            extractedText = extractedContent;
            documentFileName.textContent = file.name;
            extractedTextDisplay.textContent = extractedContent;

            // Successful transition to Q&A screen
            window.switchScreen('qaScreen'); // Use global function

            // Update status on the Q&A screen using the global function
            window.displayStatus(`Successfully extracted text from ${fileType}. Ready for Q&A!`, 'success');
            toggleChatInputs(true);
        }

    } catch (error) {
        console.error('Extraction Error:', error);
        extractedText = null;
        extractedTextDisplay.textContent = `Error during extraction: ${error.message}`;
        displayDropZoneStatus(`An error occurred during extraction: ${error.message}`, 'error');
        toggleChatInputs(false);
    } finally {
        toggleFileLoading(false);
        // Clear drop zone status if still on the initial screen, for error recovery
        if (qaScreen.classList.contains('hidden')) {
             setTimeout(() => {
                 displayDropZoneStatus('', 'hidden');
             }, 5000);
        }
    }
}

/**
 * Handles file selection from the hidden input.
 */
function handleFileInputChange() {
     console.log('handleFileInputChange called');
     const file = fileInputHidden.files[0];
     console.log('Selected file:', file);
     if (file) {
         processFile(file);
     } else {
         console.log('No file selected');
     }
}


// --- 4. GEMINI API CALL (RAG/Grounded) ---

/**
 * Calls the Gemini API with the document text as system instruction.
 */
async function callGeminiApi(userQuery) {
    // The prompt strictly limits the AI to the provided document text
    const systemPrompt = `You are an expert Q&A system. Your sole source of information is the document provided. You MUST only answer the user's question using the text found in the document provided within the triple backticks. Do not use any external knowledge.

If the answer is not available in the provided text, you MUST respond with the exact phrase: "I cannot find that information in the document."

DOCUMENT:
\`\`\`
${extractedText}
\`\`\``;

    try {
        const response = await fetch("https://docuquery-b68i.onrender.com/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userQuery: userQuery,
                systemPrompt: systemPrompt,
                extractedText: extractedText,
                model: "gemini-2.0-flash"
            })
        });

        const result = await response.json();
        return result.text || "Sorry, I received an empty response from the AI.";
    } catch (err) {
        console.error("Gemini API Error:", err);
        return `An error occurred while communicating with the AI: ${err.message}`;
    }
}


// --- 5. EVENT HANDLERS ---

/**
 * Handles the submission of the user's question.
 */
async function handleAskQuestion(e) {
    e.preventDefault();
    const userQuery = questionInput.value.trim();

    if (!userQuery) return;
    if (!extractedText) {
        // Use global displayStatus to update UI (it references the element directly)
        window.displayStatus('Please extract text from a document first!', 'error');
        return;
    }

    // 1. Display user query
    addChatMessage(userQuery, 'user');
    questionInput.value = ''; // Clear input

    // 2. Call API
    toggleChatLoading(true);
    const aiResponse = await callGeminiApi(userQuery);
    toggleChatLoading(false);

    // 3. Display AI response
    addChatMessage(aiResponse, 'ai');
}


// --- 6. DRAG AND DROP HANDLERS ---

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    console.log('handleDrop called');
    const file = e.dataTransfer.files[0];
    console.log('Dropped file:', file);

    // Check file type before processing
    const acceptedTypes = ['.pdf', '.docx', '.txt', '.pptx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!acceptedTypes.includes(fileExtension)) {
         displayDropZoneStatus(`Unsupported file type: ${fileExtension}. Please use PDF, DOCX, or TXT.`, 'error');
         return;
    }

    if (file) {
        // Manually assign the file to the hidden input to use the existing change handler
        fileInputHidden.files = e.dataTransfer.files;
        processFile(file);
    } else {
        console.log('No file in drop event');
    }
}


// --- 7. INITIALIZATION ---

async function setupEventListeners() {
    // Assign element references
    fileInputHidden = document.getElementById('fileInputHidden');
    dropZone = document.getElementById('dropZone');
    dropZoneStatus = document.getElementById('dropZoneStatus');
    initialScreen = document.getElementById('initialScreen');
    qaScreen = document.getElementById('qaScreen');
    documentFileName = document.getElementById('documentFileName');
    questionForm = document.getElementById('questionForm');
    questionInput = document.getElementById('questionInput');
    submitQuestionButton = document.getElementById('submitQuestion');
    chatHistory = document.getElementById('chatHistory');
    extractedTextDisplay = document.getElementById('extractedTextDisplay');
    loadingIndicator = document.getElementById('loadingIndicator');
    statusMessage = document.getElementById('statusMessage');
    chatLoading = document.getElementById('chatLoading');
    sendIcon = document.getElementById('sendIcon');
    themeToggle = document.getElementById('themeToggle');
    sunIcon = document.getElementById('sunIcon');
    moonIcon = document.getElementById('moonIcon');

    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    applyTheme(initialDark);
    themeToggle.addEventListener('click', toggleTheme);

    // PDF.js Fix: Dynamically import and configure PDF.js
    try {
        const pdfModule = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');

        getDocument = pdfModule.getDocument;
        const GlobalWorkerOptions = pdfModule.GlobalWorkerOptions;

        if (GlobalWorkerOptions) {
            const pdfWorkerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
            GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        } else {
            console.error("PDF.js GlobalWorkerOptions not found. PDF processing may fail.");
        }
    } catch (error) {
        console.error("Failed to dynamically import PDF.js modules:", error);
    }

    // Load mammoth.js (Tesseract removed)
    mammoth = window.mammoth;

    // --- Attach Listeners ---

    // File Upload (Click)
    fileInputHidden.addEventListener('change', handleFileInputChange);

    // File Upload (Drag and Drop)
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Q&A Form
    questionForm.addEventListener('submit', handleAskQuestion);

    // Set initial screen state
    window.switchScreen('initialScreen'); // Use global function for initial setup
}

// Delay execution until the window is fully loaded to ensure all CDNs are available
window.onload = function() {
    console.log('Window loaded, setting up event listeners...');
    setupEventListeners();
    console.log('Event listeners setup complete');
};
