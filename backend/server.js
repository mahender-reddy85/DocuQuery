const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple CORS handling (adjust for production)
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. The proxy will fail without it.');
}

// Helpful GET handler for diagnostics: return a clear message instead of 404
app.get('/api/generate', (req, res) => {
  console.warn('Received GET /api/generate - this endpoint expects POST only.');
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'This endpoint accepts POST requests with JSON body. Use POST to https://docuquery-b68i.onrender.com/api/generate'
  });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { userQuery, systemPrompt, extractedText, model, generationConfig } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY not set.' });
    }

    // Build the request body for the Gemini API
    const MODEL = model || 'gemini-2.0-flash';
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery || '' }] }],
      systemInstruction: { parts: [{ text: systemPrompt || `DOCUMENT:\n\n${extractedText || ''}` }] },
      generationConfig: generationConfig || { temperature: 0.1 }
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || null;
    return res.json({ text });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy server listening on port ${PORT}`);
});
