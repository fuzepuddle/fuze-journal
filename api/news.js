const RAPIDAPI_KEY = 'f7a0d8442dmshda90d2c0a2fe2d1p18b1f4jsn7273219764c9';
const RAPIDAPI_HOST = 'ultimate-economic-calendar.p.rapidapi.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  try {
    const now = new Date();
    const from = now.toISOString().split('T')[0];
    const to = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `https://${RAPIDAPI_HOST}/economic-events/tradingview?from=${from}&to=${to}&countries=US`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      }
    });

    if (!response.ok) throw new Error('RapidAPI fetch failed: ' + response.status);

    const data = await response.json();

    // Map to our format — inspect what fields come back
    const events = Array.isArray(data) ? data : (data.result || data.data || data.events || []);

    const filtered = events
      .filter(e => {
        const imp = (e.importance || e.impact || 0);
        // importance: 3=high, 2=medium, 1=low (varies by API)
        return imp >= 2;
      })
      .map(e => ({
        date: (e.date || e.time || '').split('T')[0].split(' ')[0],
        time: (() => {
          const raw = e.time || e.date || '';
          const t = raw.includes('T') ? raw.split('T')[1] : raw.split(' ')[1];
          return t ? t.slice(0,5) : '';
        })(),
        title: e.title || e.event || e.name || '',
        impact: (e.importance || e.impact) >= 3 ? 'High' : 'Medium',
        actual: e.actual != null ? String(e.actual) : '',
        forecast: e.forecast || e.estimate || '',
        previous: e.previous || e.prev || '',
      }))
      .filter(e => e.date && e.title);

    return res.status(200).json({ ok: true, data: filtered });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
