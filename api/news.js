export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  try {
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.forexfactory.com/'
      }
    });

    if (!response.ok) throw new Error('FF fetch failed: ' + response.status);

    const data = await response.json();

    // Filter USD only, high and medium impact
    const filtered = data.filter(e =>
      e.currency === 'USD' &&
      (e.impact === 'High' || e.impact === 'Medium' || e.impact === 'Low')
    );

    res.status(200).json({ ok: true, data: filtered });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
