const FINNHUB_KEY = 'd6ud2e1r01qp1k9c3l40d6ud2e1r01qp1k9c3l4g';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  try {
    // Get date range: today to 7 days ahead
    const now = new Date();
    const from = now.toISOString().split('T')[0];
    const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${FINNHUB_KEY}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Finnhub fetch failed: ' + response.status);

    const json = await response.json();
    const events = json.economicCalendar || [];

    // Filter USD only and map to our format
    const filtered = events
      .filter(e => e.country === 'US')
      .map(e => ({
        date: e.time ? e.time.split(' ')[0] : e.date,
        time: e.time ? e.time.split(' ')[1]?.slice(0,5) : '',
        title: e.event || '',
        impact: e.impact === 3 ? 'High' : e.impact === 2 ? 'Medium' : 'Low',
        actual: e.actual != null ? String(e.actual) : '',
        forecast: e.estimate != null ? String(e.estimate) : '',
        previous: e.prev != null ? String(e.prev) : '',
      }))
      .filter(e => e.title && (e.impact === 'High' || e.impact === 'Medium'));

    return res.status(200).json({ ok: true, data: filtered });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
