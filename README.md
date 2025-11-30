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
- **Client-Side Processing** - All text extraction happens in your browser
- **Secure** - No data is stored on external servers during processing
- **No Server Dependency** - Complete privacy-first approach

## Project Structure

```
DocuQuery/
├── index.html          # Main HTML file
├── folder.css          # Complete stylesheet with responsive design
├── folder.js           # JavaScript logic and event handlers
├── DocuQuery.jpg       # Favicon
├── package.json        # Project configuration
└── README.md           # This file
```

## File Descriptions

### `index.html`
- Main application HTML file
- Contains two main screens:
  - **Initial Upload Screen** - Document upload interface
  - **Q&A Screen** - Document display and chat interface
- Responsive layout with mobile-first design

### `folder.css`
- Complete custom CSS stylesheet (821 lines)
- Features:
  - Comprehensive utility classes
  - Dark mode support with `dark:` prefixed classes
  - Responsive media queries for mobile/tablet/desktop
  - Status message styling (success, error, warning)
  - Custom chat bubble styling
  - Grid layout for responsive panels

### `folder.js`
- JavaScript module with core functionality:
  - Document text extraction (PDF, DOCX, TXT)
  - Gemini API integration for AI responses
  - Theme toggle functionality
  - Chat history management
  - Drag-and-drop file handling
  - Error handling and user feedback

### `DocuQuery.jpg`
- Application favicon displayed in browser tabs

### `package.json`
- Project metadata and configuration

## Technologies Used

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with responsive design
- **Vanilla JavaScript** - ES6 modules

### Libraries & APIs
- **Mammoth.js** - DOCX to text conversion
- **PDF.js** - PDF text extraction
- **Google Gemini API** - AI-powered responses (v1beta, gemini-2.0-flash model)

### Styling
- **Custom CSS** - Full responsive design implementation
- **Mobile-First Design** - Breakpoint at 1024px (lg)

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
- Chat history is maintained throughout the session

### 4. Switch Documents
- Click "Upload New File" to upload another document
- Previous conversation clears when switching documents

### 5. Toggle Theme
- Click the theme toggle button (sun/moon icon) in the top right
- Switches between light and dark modes
- Preference is saved in local storage

## Responsive Design

### Mobile Devices (< 1024px)
- Single column layout
- Document content and chat stack vertically
- Full-width panels with appropriate padding

### Desktop (≥ 1024px)
- Two-column grid layout
- Document content on left, chat on right
- Side-by-side panels for efficient viewing

## Dark Mode Support

All text and UI elements have proper dark mode variants:
- **Text Colors** - All text remains visible in both themes
- **Background Colors** - Proper contrast in light and dark modes
- **Status Messages** - Success (green), Error (red), Warning (yellow) with dark variants
- **Input Fields** - Properly styled for both themes
- **Borders & Shadows** - Adjusted for visibility in both modes

## API Configuration (Secure)

This project no longer stores API keys in client-side code. Client-side keys are easily discovered in public repositories and are insecure. Instead, run a small server-side proxy that keeps the API key in an environment variable and forwards requests to the Gemini API.

- **Model**: `gemini-2.0-flash` (configurable)
- **Proxy endpoint**: `POST /api/generate` (provided by `server.js`)
- **Temperature**: configurable via the request payload
- **API Key storage**: `GEMINI_API_KEY` in a local `.env` file or environment variable (do NOT commit `.env`)

See `server.js` and `.env.example` for details.

## Browser Compatibility

- **Chrome/Edge** - Full support
- **Firefox** - Full support
- **Safari** - Full support
- **Mobile Browsers** - Full support with responsive design

## Getting Started (Local, secure API key)

1. Clone or download this repository
2. Copy `.env.example` to `.env` and add your real key:

```powershell
copy .env.example .env
# then edit .env and fill GEMINI_API_KEY
```

3. Install dependencies and start the server (Node 18+ recommended):

```powershell
npm install express dotenv
npm start
```

4. Open `index.html` in your browser (or serve the static files from a web server). The frontend will call the local proxy at `http://localhost:3000/api/generate` to get AI responses.

5. To change the port, set `PORT` environment variable before starting the server.

6. IMPORTANT: Revoke the exposed API key immediately (see Security section below) and rotate to a new key stored in `.env`.

## Notes

- PPTX format is shown in the UI but extraction is not currently implemented
- All processing happens client-side for maximum privacy
- The AI model is specifically configured to only use document content for answers
- Local storage is used for theme preference persistence

## Security & Key Rotation

- If an API key was committed, revoke it immediately via the Google Cloud Console and create a new key.
- To remove the key from your git history, use one of the following (choose one):

  - Using BFG (recommended for large repos):

    ```powershell
    # Replace 'YOUR_SECRET' with the actual secret string
    bfg --delete-files .env
    bfg --replace-text replacements.txt
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    ```

  - Using git filter-repo (preferred modern tool):

    ```powershell
    # Install git-filter-repo then run (example removing a key literal)
    git filter-repo --invert-paths --paths .env
    ```

  - Or using git filter-branch (legacy):

    ```powershell
    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch path/to/file" --prune-empty --tag-name-filter cat -- --all
    ```

- After rewriting history, you'll need to force-push the cleaned branch: `git push --force origin main` and ask collaborators to re-clone.

Always assume any exposed key is compromised and rotate it immediately.

## Version

**Version**: 1.0.0  
**Last Updated**: November 30, 2025  
**Repository**: mahender-reddy85/DocuQuery
