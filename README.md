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

## API Configuration

The application uses Google's Gemini API:
- **Model**: `gemini-2.0-flash` (latest available)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Temperature**: 0.1 (low creativity for grounded responses)
- **API Key**: Configured in `folder.js` (replace with your own key)

## Browser Compatibility

- **Chrome/Edge** - Full support
- **Firefox** - Full support
- **Safari** - Full support
- **Mobile Browsers** - Full support with responsive design

## Getting Started

1. Clone or download this repository
2. Replace the API key in `folder.js` with your own Gemini API key
3. Open `index.html` in a modern web browser
4. Upload a document and start asking questions

## Notes

- PPTX format is shown in the UI but extraction is not currently implemented
- All processing happens client-side for maximum privacy
- The AI model is specifically configured to only use document content for answers
- Local storage is used for theme preference persistence

## Version

**Version**: 1.0.0  
**Last Updated**: November 30, 2025  
**Repository**: mahender-reddy85/DocuQuery
