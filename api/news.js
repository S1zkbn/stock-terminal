export default async function handler(req, res) {
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GNEWS_API_KEY"
    });
  }

  const query =
    '"US stock market" OR "Wall Street" OR "S&P 500" OR Nasdaq OR Dow OR "Federal Reserve" OR earnings OR inflation';

  const url =
    "https://gnews.io/api/v4/search?q=" +
    encodeURIComponent(query) +
    "&lang=en" +
    "&country=us" +
    "&max=10" +
    "&sortby=publishedAt" +
    "&apikey=" +
    apiKey;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "GNews error",
        details: data
      });
    }

    const articles = (data.articles || []).map(article => ({
      title: article.title || "Market News",
      link: article.url || "#",
      pubDate: article.publishedAt || "",
      source: article.source?.name || "Market News",
      image: article.image || "https://images.unsplash.com/photo-1642790551116-18e150f248e6?auto=format&fit=crop&w=900&q=80"
    }));

    res.setHeader(
      "Cache-Control",
      "s-maxage=86400, stale-while-revalidate=3600"
    );

    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      articles
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to load market news",
      details: String(error)
    });
  }
}
