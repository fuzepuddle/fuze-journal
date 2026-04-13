export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Manually read and parse the raw body
    const rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    // Validate it's real JSON before forwarding
    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body', detail: e.message });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(parsed),
    });

    const data = await response.json();

    // If Anthropic returns an error, pass it back so we can see it
    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
    }

    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', detail: err.message });
  }
}
