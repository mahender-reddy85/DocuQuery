# DocuQuery: Q&A

An intelligent document processing and question-answering application that lets you upload documents (PDF, DOCX, TXT) and ask questions about their content using AI-powered responses grounded in the document text.

## Features

### 📄 Document Support
- **PDF Files** - Extract text from PDF documents
- **DOCX Files** - Extract text from Microsoft Word documents  
- **TXT Files** - Plain text file support
- **Drag & Drop** - Easy file upload with drag-and-drop interface
- **Click to Browse** - Traditional file picker support

### 🤖 AI-Powered Q&A
- **Gemini 2.0 Flash** - State-of-the-art AI model for intelligent responses
- **Grounded Responses** - AI strictly limited to answering based on document content
- **Real-time Chat** - Interactive conversation interface
- **No External Knowledge** - Ensures answers are document-specific

### 🎨 User Interface
- **Dark Mode Support** - Full dark and light theme support with system preference detection
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Mobile Optimized** - Stacked layout on mobile, side-by-side on desktop
- **Clean & Modern** - Custom CSS styling with intuitive UI components

### 🔒 Privacy & Security
- **Client-Side Processing** - Most text extraction happens in your browser
- **Secure** - No data is stored on external servers during processing
- **Privacy First** - Complete privacy-first approach

## Project Structure

```
DocuQuery/
├── frontend/
│   ├── index.html          # Main HTML entry point
│   ├── DocuQuery.css       # Clean, deduplicated stylesheet
│   ├── DocuQuery.js        # Core JavaScript logic & API integration
│   └── DocuQuery.jpg       # Icon / Favicon
├── backend/
│   ├── server.js           # Secure node.js proxy for Gemini API
│   ├── package.json        # Backend configuration (Express, Dotenv)
│   └── .env.example        # Template for environment variables
└── README.md               # This file
```

## How to Get Started

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Add your **Google Gemini API Key** to the `.env` file.
5. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Access
1. Open `frontend/index.html` in your browser.
2. The frontend will automatically detect if you are running locally (`localhost`) and call your local proxy at `http://localhost:3000/api/generate`.
3. If deployed, it can be configured to call your production backend.

## How to Use

### 1. Upload a Document
- Click on the drop zone or drag & drop a file
- Supported formats: PDF, DOCX, TXT
- File is processed securely in your browser

### 2. View Extracted Text
- After upload, extracted text appears in the left panel
- Full text preview with scrollable area

### 3. Ask Questions
- Type questions in the input field
- AI responds based only on the document content

### 4. Toggle Theme
- Click the theme toggle button (sun/moon icon) in the top right
- Switches between light and dark modes

## Technologies Used
- **Frontend**: HTML5, CSS3 (Custom Utilities), Vanilla JavaScript (ESM)
- **Extraction**: Mammoth.js (DOCX), PDF.js (PDF)
- **AI Engine**: Google Gemini 2.0 Flash
- **Backend**: Node.js, Express, Dotenv

## License
ISC

---
**Version**: 1.1.0 (Cleaned & Optimized)  
**Last Updated**: March 21, 2026  
**Repository**: mahender-reddy85/DocuQuery
