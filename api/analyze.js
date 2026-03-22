export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: 'No notes provided' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a strict ICT trading coach reviewing a trade from this exact model:\n\nNASDAQ NY Continuation Model:\n1. NY window 14:30-16:00 UK only\n2. One clear HTF draw (PDH/L, CDH/L, Asia H/L, London H/L, EQH/L, 1H FVG)\n3. 4H/1H structure aligned, momentum candles, no chop\n4. 15M displacement: strong BOS, 5M FVG left behind, displacement > retrace\n5. 5M FVG retrace: slow/corrective, best case 50% midpoint or V-shape\n6. 1M confirmation: BOS driving toward draw, wait for candle close\n7. SL below FVG, move to BE immediately\n8. TP at nearest HTF draw only, hard close 16:30 UK\n\nTrade notes from the trader:\n${notes}\n\nGive concise feedback (max 150 words): Did they follow the model? What did they do well? What needs improvement? Be direct and specific.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : 'No response';
    res.status(200).json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
