const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/proxy/audio', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'missing url parameter' });
  }

  try {
    const remote = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });

    if (!remote.ok) {
      return res.status(remote.status).json({ error: 'Remote server responded with status ' + remote.status });
    }

    const chunks = [];
    for await (const chunk of remote.body) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', remote.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'proxy failed', detail: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'quran-audio-proxy' });
});

app.listen(PORT, () => {
  console.log(`Quran audio proxy running on http://localhost:${PORT}`);
});
