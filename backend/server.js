require('dotenv').config();
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

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('Warning: OPENROUTER_API_KEY is not set. The proxy will fail without it.');
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
    const { userQuery, systemPrompt, extractedText, model } = req.body || {};
    const MODEL = model || 'meta-llama/llama-3-8b-instruct';

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: OPENROUTER_API_KEY not set.' });
    }

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt || `DOCUMENT:\n\n${extractedText}` },
        { role: "user", content: userQuery || "" }
      ]
    };

    // ----- Call OpenRouter -----
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();

    if (!response.ok) {
      return res.status(response.status).send(raw);
    }

    const json = JSON.parse(raw);

    return res.json({
      text: json.choices?.[0]?.message?.content || "No response received."
    });

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
