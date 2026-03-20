export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.forexfactory.com',
    'Referer': 'https://www.forexfactory.com/',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
  };

  // Try with a random cache-busting param to avoid rate limit
  const cacheBust = Date.now();
  const urls = [
    `https://nfs.faireconomy.media/ff_calendar_thisweek.json?t=${cacheBust}`,
    `https://nfs.faireconomy.media/ff_calendar_thisweek.json`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.log('FF response:', response.status, url);
        continue;
      }
      const data = await response.json();
      const filtered = data.filter(e =>
        e.currency === 'USD' &&
        (e.impact === 'High' || e.impact === 'Medium' || e.impact === 'Low')
      );
      return res.status(200).json({ ok: true, data: filtered });
    } catch (err) {
      console.log('FF error:', err.message);
      continue;
    }
  }

  return res.status(429).json({ ok: false, error: 'ForexFactory rate limited' });
}
