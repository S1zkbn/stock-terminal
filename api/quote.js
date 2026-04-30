export default async function handler(req, res) {
  const symbols = req.query.symbols;

  if (!symbols) {
    return res.status(400).json({ error: "Missing symbols" });
  }

  const apiKey = process.env.TWELVE_DATA_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  const url =
    "https://api.twelvedata.com/quote?symbol=" +
    encodeURIComponent(symbols) +
    "&apikey=" +
    apiKey;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch quote" });
  }
}