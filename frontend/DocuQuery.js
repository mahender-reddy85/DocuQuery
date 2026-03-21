// --- GLOBAL UTILITIES ---

window.displayStatus = function(message, type = 'warning') {
    const badge = document.getElementById('headerStatusMessage');
    if (!badge) return;
    
    badge.textContent = message;
    badge.className = 'text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 inline-block whitespace-nowrap lg:ml-2';

    if (type === 'error') {
        badge.classList.add('text-rose-600', 'bg-rose-50', 'dark:text-rose-400', 'dark:bg-rose-900/40');
    } else if (type === 'success') {
        badge.classList.add('text-emerald-600', 'bg-emerald-50', 'dark:text-emerald-400', 'dark:bg-emerald-900/40');
    } else {
        badge.classList.add('text-amber-600', 'bg-amber-50', 'dark:text-amber-400', 'dark:bg-amber-900/40');
    }
    
    badge.classList.remove('hidden');
};

window.switchScreen = function(targetId) {
    const initialScreen = document.getElementById('initialScreen');
    const qaScreen = document.getElementById('qaScreen');
    
    if (targetId === 'initialScreen') {
        qaScreen.classList.add('hidden');
        initialScreen.classList.remove('hidden');
        
        // Reset state
        if (window.toggleChatInputs) window.toggleChatInputs(false);
        const extractedTextDisplay = document.getElementById('extractedTextDisplay');
        if (extractedTextDisplay) extractedTextDisplay.innerHTML = '<p class="text-gray-400 italic">Extracted text will appear here.</p>';
        
        const dropZoneStatus = document.getElementById('dropZoneStatus');
        if (dropZoneStatus) {
            dropZoneStatus.classList.add('hidden');
            dropZoneStatus.textContent = '';
        }
    } else {
        initialScreen.classList.add('hidden');
        qaScreen.classList.remove('hidden');
    }
};

window.saveChat = function() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    let chatText = 'DocuQuery AI Chat Log\n';
    chatText += '-------------------------------\n\n';
    
    const bubbles = chatHistory.querySelectorAll('div > .ai-response, div > .user-query, .custom-ai-bubble, .ai-response, .user-query');
    bubbles.forEach(bubble => {
        if (bubble.id === 'aiPlaceholder') return; // Skip thinking indicator
        const isUser = bubble.classList.contains('user-query');
        const role = isUser ? 'You' : 'DocuQuery AI';
        chatText += `${role}:\n${bubble.innerText.trim()}\n\n`;
    });
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocuQuery_Chat_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- CONFIGURATION ---

const MODEL = 'gemini-2.0-flash';
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'http://localhost:3000/api/generate'
    : 'https://docuquery-b68i.onrender.com/api/generate';

// --- STATE ---

let extractedText = null;
let getDocument;
let mammoth;
let Tesseract;
let JSZip;

// Element references
let fileInputHidden, dropZone, dropZoneStatus, initialScreen, qaScreen, documentFileName;
let questionForm, questionInput, submitQuestionButton, chatHistory, extractedTextDisplay;
let loadingIndicator, statusMessage, chatLoading, sendIcon;
let themeToggle, sunIcon, moonIcon;

// --- UTILITY FUNCTIONS ---

function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
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
    dropZoneStatus.className = 'status-badge mt-4';
    
    if (type === 'processing') dropZoneStatus.classList.add('status-warning');
    else if (type === 'error') dropZoneStatus.classList.add('status-error');
    else {
        dropZoneStatus.classList.add('hidden');
        return;
    }
    dropZoneStatus.classList.remove('hidden');
}

function scrollChatToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addChatMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('max-w-[85%]', 'whitespace-pre-wrap');
    messageDiv.classList.add(role === 'user' ? 'user-query' : 'ai-response');
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
        placeholder.classList.add('ai-response');
        placeholder.innerHTML = 'Thinking...';
        chatHistory.appendChild(placeholder);
        scrollChatToBottom();
    } else {
        const placeholder = document.getElementById('aiPlaceholder');
        if (placeholder) placeholder.remove();
    }
}

window.toggleChatInputs = function(enable) {
    if (questionInput) questionInput.disabled = !enable;
    if (submitQuestionButton) submitQuestionButton.disabled = !enable;
};

function toggleFileLoading(isLoading) {
    loadingIndicator.classList.toggle('hidden', !isLoading);
}

// --- EXTRACTION ---

async function extractDocxText(file) {
    if (!mammoth) throw new Error("Mammoth.js not loaded.");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
}

async function extractPdfText(file) {
    if (!getDocument) throw new Error("PDF.js not initialized.");
    const buffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY = null;
        let text = '';
        
        for (let item of textContent.items) {
            // If the absolute Y coordinate changes by more than 5 points, assume it's a new line.
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 4) {
                 text += '\n';
            } else if (lastY !== null && text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
                 // Add a space between words on the same line if they don't already touch
                 text += ' ';
            }
            text += item.str;
            if (item.hasEOL) {
                 text += '\n';
            }
            lastY = item.transform[5];
        }
        
        // Clean up formatting
        text = text.replace(/ +/g, ' ').replace(/\n /g, '\n');
        fullText += text + '\n\n';
    }
    return fullText.trim();
}

async function extractPptxText(file) {
    if (!window.JSZip) throw new Error("JSZip not loaded.");
    const zip = await window.JSZip.loadAsync(file);
    let fullText = '';
    
    // Find all slides
    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
    
    // Process slides in order
    slideFiles.sort((a,b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)[1]);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)[1]);
        return numA - numB;
    });

    for (const slideFile of slideFiles) {
        const xmlText = await zip.files[slideFile].async("string");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const textNodes = xmlDoc.getElementsByTagName("a:t");
        for (let i = 0; i < textNodes.length; i++) {
            fullText += textNodes[i].textContent + " ";
        }
        fullText += "\n\n";
    }
    return fullText.trim();
}

async function processFile(file) {
    toggleFileLoading(true);
    displayDropZoneStatus(`Processing ${file.name}...`, 'processing');
    
    const ext = file.name.split('.').pop().toLowerCase();
    let content = '';
    let fileType = 'Unknown';

    try {
        if (ext === 'pdf') {
            fileType = 'PDF';
            content = await extractPdfText(file);
        } else if (ext === 'docx') {
            fileType = 'DOCX';
            content = await extractDocxText(file);
        } else if (ext === 'pptx') {
            fileType = 'PPTX';
            content = await extractPptxText(file);
        } else if (['txt', 'md', 'markdown'].includes(ext) || file.name.toLowerCase() === 'readme') {
            fileType = (ext === 'md' || ext === 'markdown') ? 'Markdown' : 'Text';
            content = await file.text();
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }

        if (!content || content.length < 5) {
             throw new Error("No readable text found in document.");
        }

        extractedText = content;
        documentFileName.textContent = file.name;
        extractedTextDisplay.textContent = content;

        window.switchScreen('qaScreen');
        window.displayStatus(`Ready`, 'success');
        window.toggleChatInputs(true);

    } catch (error) {
        console.error('Extraction Error:', error);
        displayDropZoneStatus(`Error: ${error.message}`, 'error');
        window.toggleChatInputs(false);
    } finally {
        toggleFileLoading(false);
    }
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
            body: JSON.stringify({ userQuery, systemPrompt, extractedText, model: MODEL })
        });
        
        let result;
        const rawText = await response.text();
        
        try {
            result = JSON.parse(rawText);
        } catch(e) {
            result = { error: rawText };
        }
        
        if (!response.ok) {
            return `API Error (${response.status}): ${result.error?.message || result.error || JSON.stringify(result)}`;
        }
        
        return result.text || "No response received.";
    } catch (err) {
        return `Connection Error: ${err.message}. Please physically ensure your backend server (node server.js) is currently running on port 3000.`;
    }
}

// --- EVENT HANDLERS ---

async function handleAskQuestion(e) {
    e.preventDefault();
    const query = questionInput.value.trim();
    if (!query || !extractedText) return;

    addChatMessage(query, 'user');
    questionInput.value = '';
    toggleChatLoading(true);
    const answer = await callGeminiApi(query);
    toggleChatLoading(false);
    addChatMessage(answer, 'ai');
}

function setupEventListeners() {
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
    [sunIcon, moonIcon] = [document.getElementById('sunIcon'), document.getElementById('moonIcon')];

    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));
    themeToggle.addEventListener('click', toggleTheme);

    // Initial Screen
    window.switchScreen('initialScreen');

    // PDF.js
    import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs').then(m => {
        getDocument = m.getDocument;
        m.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    });

    mammoth = window.mammoth;

    // Listeners
    fileInputHidden.addEventListener('change', () => {
        if (fileInputHidden.files[0]) processFile(fileInputHidden.files[0]);
    });
    
    // Global Drag & Drop Overlay Logic
    let dragCounter = 0;
    const overlay = document.getElementById('globalDragOverlay');

    window.addEventListener('dragenter', e => {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1 && overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }
    });

    window.addEventListener('dragleave', e => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0 && overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    });

    window.addEventListener('dragover', e => {
        e.preventDefault();
    });

    window.addEventListener('drop', e => {
        e.preventDefault();
        dragCounter = 0;
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
        if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
    });

    questionForm.addEventListener('submit', handleAskQuestion);
}

window.onload = setupEventListeners;
