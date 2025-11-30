const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// ----- CORS -----
// Full CORS support to allow requests from static frontends
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. The proxy will fail without it.');
}

// ----- Optional Diagnostics -----
app.get('/', (req, res) => {
  res.send('DocuQuery backend is running. Use POST /api/generate');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Block GET on generate
app.get('/api/generate', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'Use POST /api/generate with JSON body'
  });
});

// ----- MAIN API -----
app.post('/api/generate', async (req, res) => {
  try {
    const { userQuery, systemPrompt, extractedText, model, generationConfig } = req.body || {};
    const MODEL = model || 'gemini-2.0-flash';

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY not set.' });
    }

    // Gemini API endpoint
    const API_ENDPOINT = 
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // ----- FIX 1: Proper Gemini request structure -----
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: userQuery || "" }]
        }
      ],
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt || `DOCUMENT:\n\n${extractedText}` }]
      },
      generationConfig: generationConfig || { temperature: 0.3 }
    };

    // ----- Call Gemini -----
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();

    if (!response.ok) {
      return res.status(response.status).send(raw);
    }

    const json = JSON.parse(raw);

    // ----- FIX 2: Robust extraction (covers ALL formats) -----
    let text = null;

    // Standard response
    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = json.candidates[0].content.parts[0].text;
    }
    // Variant: content is array of parts
    else if (json.candidates?.[0]?.content?.[0]?.text) {
      text = json.candidates[0].content[0].text;
    }
    // Variant: output field
    else if (json.candidates?.[0]?.output) {
      text = json.candidates[0].output;
    }
    // Variant: direct text field
    else if (json.text) {
      text = json.text;
    }

    // Final fallback: force a readable string
    if (!text) text = "I'm sorry — the model returned no readable text.";

    return res.json({ text });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Unknown backend error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy server listening on port ${PORT}`);
});
