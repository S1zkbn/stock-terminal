let cache = null;
let cacheTime = 0;

export default async function handler(req, res) {
  const symbols = req.query.symbols;
  const apiKey = process.env.TWELVE_DATA_KEY;

  if (!symbols) return res.status(400).json({ error: "Missing symbols" });
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  const now = Date.now();

  if (cache && now - cacheTime < 60000) {
    return res.status(200).json(cache);
  }

  const url =
    "https://api.twelvedata.com/quote?symbol=" +
    encodeURIComponent(symbols) +
    "&apikey=" +
    apiKey;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.code === 429 && cache) {
      return res.status(200).json(cache);
    }

    cache = data;
    cacheTime = now;

    return res.status(200).json(data);
  } catch (e) {
    if (cache) return res.status(200).json(cache);
    return res.status(500).json({ error: "Fetch failed" });
  }
}
