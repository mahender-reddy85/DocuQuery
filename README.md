# DocuQuery

An advanced, intelligent document processing and question-answering application that lets you instantly drag and drop over 20+ document formats and chat with their content using AI. The system is entirely powered by **Llama 3 8B Instruct** via OpenRouter and built with a sleek, responsive Tailwind UI.

## ✨ Key Features

### 📄 Universal Document Support
DocuQuery uses a suite of custom 8-bit text rippers, regex algorithms, and native XML tree-walkers to strictly extract raw information natively from browsers:
- **Word Processors:** `.docx`, `.doc`, `.rtf`, `.odt`, `.pages`, `.wps`
- **Presentations:** `.pptx`, `.ppt`, `.ppsx`, `.key`, `.odp`
- **Web & Markup:** `.md`, `.html`, `.xml`, `.tex`
- **Universals:** `.pdf`, `.txt`
- **Global Drag & Drop:** A frosted-glass drop zone detects files dragged directly into your browser from anywhere on your OS.

### 🧠 Advanced AI Integration
- **Llama 3 Powered:** Re-wired explicitly to use Meta's highly-capable Llama-3-8B-Instruct model via OpenRouter API.
- **Source Citations:** AI automatically tracks PDF struct markers and actively cites `Source: Page X` so you can verify its facts natively.
- **Student / ELI5 Mode:** Dynamically switch the AI's persona from technical auditor to beginner-friendly instructor using the header toggle.
- **Suggested Questions:** Instantly trigger contextual prompts with one click to break blank-page syndrome.

### 🎨 Premium UI/UX
- **Modern Tailwind Design:** Custom dark/light mode toggle adapting systematically to your OS preference.
- **Responsive Geometry:** CSS Grid architecture collapses elegantly from a dual-pane workstation into a vertically stacked mobile app automatically.
- **Copy Buttons:** Native clipboard exporting directly embedded into AI chat bubbles.
- **Chat Archiving:** Click `Save Chat` to securely dump and download your existing conversation history into a formatted `.txt` file.

## 🚀 Getting Started

### 1. Server Setup (Local or Cloud)
The app uses an Express proxy to securely hide your API Token.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
2. Get an API key from [OpenRouter](https://openrouter.ai/).
3. Add the key locally by creating a file named `.env.local` in the backend folder:
   ```env
   OPENROUTER_API_KEY=your_key_here
   ```
   *(If deploying to Render, simply add the key to your Render Environment Dashboard).*
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Execution
Simply open `frontend/index.html` natively in your browser!
The application's dynamic router will automatically detect `file:///` and intelligently bounce API calls straight to your local node proxy, or natively target your cloud domain if you host it elsewhere.

## 🛠️ Technology Stack
- **Frontend Architecture:** HTML5, CSS3, Vanilla JS (ESModules), Tailwind CSS Utilities
- **Native Document Parsers:** PDF.js, Mammoth.js, JSZip
- **Backend Infrastructure:** Node.js, Express, strict JSON chunking limitations
- **AI Brain:** OpenRouter API 

---
**Version**: 2.0.0 (The Llama Update)  
**Last Updated**: March 21, 2026  
**Repository**: mahender-reddy85/DocuQuery
