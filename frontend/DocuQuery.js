// Define displayStatus globally first, as it's needed by both the module and switchScreen
window.displayStatus = function(message, type = 'warning') {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) return;
    
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
    const brandingContainer = document.getElementById('brandingContainer');
    const mainHeader = document.getElementById('mainHeader');
    const dropZoneStatus = document.getElementById('dropZoneStatus');

    if (targetId === 'initialScreen') {
        qaScreen.classList.add('hidden');
        initialScreen.classList.remove('hidden');

        // Restore header positioning for centered screen
        mainHeader.classList.add('absolute', 'top-0', 'left-0', 'right-0');
        mainHeader.classList.remove('relative', 'mb-6');

        brandingContainer.classList.remove('hidden'); // Show branding

        // Clear the drop zone status message when returning to initial screen
        if (dropZoneStatus) {
            dropZoneStatus.textContent = '';
            dropZoneStatus.classList.add('hidden');
        }

        // Clear state when returning to upload screen
        documentFileName.textContent = '';
        extractedTextDisplay.innerHTML = '<p class="text-gray-400 italic">Extracted text will appear here.</p>';
        
        // Use the global function to update inputs (will be defined later in module)
        if (window.toggleChatInputs) window.toggleChatInputs(false);
        window.displayStatus('Awaiting file upload (PDF, DOCX, TXT).', 'warning');
    } else {
        initialScreen.classList.add('hidden');
        qaScreen.classList.remove('hidden');

        // Adjust header positioning for QA screen
        mainHeader.classList.remove('absolute', 'top-0', 'left-0', 'right-0');
        mainHeader.classList.add('relative', 'mb-6');

        brandingContainer.classList.add('hidden'); // Hide branding
    }
};

// --- CONFIGURATION ---

// Gemini model choice
const MODEL = 'gemini-2.0-flash';

// API Configuration
// For local development, use: http://localhost:3000/api/generate
// For production, use your deployed server URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/generate'
    : 'https://docuquery-b68i.onrender.com/api/generate';

// --- STATE ---

let extractedText = null;
let getDocument;
let mammoth;

// Element references
let fileInputHidden, dropZone, dropZoneStatus, initialScreen, qaScreen, documentFileName;
let questionForm, questionInput, submitQuestionButton, chatHistory, extractedTextDisplay;
let loadingIndicator, statusMessage, chatLoading, sendIcon;
let themeToggle, sunIcon, moonIcon;

// --- UTILITY FUNCTIONS ---

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

function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme === 'dark');
}

function displayDropZoneStatus(message, type) {
    if (!dropZoneStatus) return;
    dropZoneStatus.textContent = message;
    dropZoneStatus.classList.remove('hidden', 'text-blue-500', 'text-red-500', 'dark:text-blue-300', 'dark:text-red-300');

    if (type === 'processing') {
        dropZoneStatus.classList.add('text-blue-500', 'dark:text-blue-300');
    } else if (type === 'error') {
        dropZoneStatus.classList.add('text-red-500', 'dark:text-red-300');
    } else {
        dropZoneStatus.classList.add('hidden');
        return;
    }
    dropZoneStatus.classList.remove('hidden');
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

function scrollChatToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addChatMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('max-w-[85%]', 'whitespace-pre-wrap');

    if (role === 'user') {
        messageDiv.classList.add('user-query', 'self-end');
    } else {
        messageDiv.classList.add('ai-response', 'self-start');
    }
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');

    chatHistory.appendChild(messageDiv);
    scrollChatToBottom();
}

function toggleChatLoading(isLoading) {
    questionInput.disabled = isLoading;
    submitQuestionButton.disabled = isLoading;
    chatLoading.classList.toggle('hidden', !isLoading);
    sendIcon.classList.toggle('hidden', isLoading);
    if (isLoading) {
        const placeholder = document.createElement('div');
        placeholder.id = 'aiPlaceholder';
        placeholder.classList.add('ai-response', 'self-start');
        placeholder.innerHTML = 'Thinking...';
        chatHistory.appendChild(placeholder);
        scrollChatToBottom();
    } else {
        const placeholder = document.getElementById('aiPlaceholder');
        if (placeholder) placeholder.remove();
    }
}

// Make toggleChatInputs global so switchScreen can access it
window.toggleChatInputs = function(enable) {
    if (questionInput) questionInput.disabled = !enable;
    if (submitQuestionButton) submitQuestionButton.disabled = !enable;
};

function toggleFileLoading(isLoading) {
    loadingIndicator.classList.toggle('hidden', !isLoading);
}

// --- EXTRACTION ---

async function extractDocxText(file) {
    if (!mammoth) throw new Error("mammoth.js not loaded.");
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

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

async function processFile(file) {
    // PPTX check
    if (file.name.endsWith('.pptx') || file.type.includes('officedocument.presentationml')) {
         displayDropZoneStatus(`PPTX files are currently not supported for extraction. Please use PDF, DOCX, or TXT.`, 'error');
         return;
    }

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
            throw new Error(`Unsupported file type: ${mimeType}. Please use PDF, DOCX, or TXT.`);
        }

        if (!extractedContent || extractedContent.trim().length === 0) {
            extractedText = null;
            extractedTextDisplay.textContent = 'No text could be extracted from this file.';
            displayDropZoneStatus(`Extraction failed: No readable text found in ${fileType}.`, 'error');
            window.toggleChatInputs(false);
        } else {
            extractedText = extractedContent;
            documentFileName.textContent = file.name;
            extractedTextDisplay.textContent = extractedContent;

            window.switchScreen('qaScreen');
            window.displayStatus(`Successfully extracted text from ${fileType}. Ready for Q&A!`, 'success');
            window.toggleChatInputs(true);
        }

    } catch (error) {
        console.error('Extraction Error:', error);
        extractedText = null;
        extractedTextDisplay.textContent = `Error during extraction: ${error.message}`;
        displayDropZoneStatus(`An error occurred during extraction: ${error.message}`, 'error');
        window.toggleChatInputs(false);
    } finally {
        toggleFileLoading(false);
        if (qaScreen.classList.contains('hidden')) {
             setTimeout(() => {
                 displayDropZoneStatus('', 'hidden');
             }, 5000);
        }
    }
}

function handleFileInputChange() {
     const file = fileInputHidden.files[0];
     if (file) processFile(file);
}

// --- API ---

async function callGeminiApi(userQuery) {
    const systemPrompt = `You are an expert Q&A system. Your sole source of information is the document provided. You MUST only answer the user's question using the text found in the document provided within the triple backticks. Do not use any external knowledge.

If the answer is not available in the provided text, you MUST respond with the exact phrase: "I cannot find that information in the document."

DOCUMENT:
\`\`\`
${extractedText}
\`\`\``;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userQuery,
                systemPrompt,
                extractedText,
                model: MODEL
            })
        });

        const result = await response.json();
        return result.text || "Sorry, I received an empty response from the AI.";
    } catch (err) {
        console.error("Gemini API Error:", err);
        return `An error occurred while communicating with the AI: ${err.message}`;
    }
}

// --- EVENT HANDLERS ---

async function handleAskQuestion(e) {
    e.preventDefault();
    const userQuery = questionInput.value.trim();

    if (!userQuery) return;
    if (!extractedText) {
        window.displayStatus('Please extract text from a document first!', 'error');
        return;
    }

    addChatMessage(userQuery, 'user');
    questionInput.value = '';

    toggleChatLoading(true);
    const aiResponse = await callGeminiApi(userQuery);
    toggleChatLoading(false);

    addChatMessage(aiResponse, 'ai');
}

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
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const acceptedTypes = ['.pdf', '.docx', '.txt', '.pptx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!acceptedTypes.includes(fileExtension)) {
         displayDropZoneStatus(`Unsupported file type: ${fileExtension}. Please use PDF, DOCX, or TXT.`, 'error');
         return;
    }

    fileInputHidden.files = e.dataTransfer.files;
    processFile(file);
}

// --- INITIALIZATION ---

async function setupEventListeners() {
    // References
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

    // Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));
    themeToggle.addEventListener('click', toggleTheme);

    // PDF.js
    try {
        const pdfModule = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
        getDocument = pdfModule.getDocument;
        if (pdfModule.GlobalWorkerOptions) {
            pdfModule.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
        }
    } catch (error) {
        console.error("Failed to load PDF.js:", error);
    }

    // Mammoth
    mammoth = window.mammoth;

    // Listeners
    fileInputHidden.addEventListener('change', handleFileInputChange);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    questionForm.addEventListener('submit', handleAskQuestion);

    window.switchScreen('initialScreen');
}

window.onload = setupEventListeners;
