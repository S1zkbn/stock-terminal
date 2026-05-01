export default async function handler(req, res) {
  const query = req.query.q || "stock market OR Nvidia OR Meta OR S&P 500";
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing GNEWS_API_KEY" });
  }

  const url =
    "https://gnews.io/api/v4/search?q=" +
    encodeURIComponent(query) +
    "&lang=en&country=us&max=10&apikey=" +
    apiKey;

  try {
    const response = await fetch(url);
    const data = await
