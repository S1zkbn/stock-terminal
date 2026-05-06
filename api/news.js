export default async function handler(req, res) {
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GNEWS_API_KEY"
    });
  }

  const queries = [
    '"US stock market" OR "Wall Street" OR "S&P 500" OR Nasdaq OR Dow',
    '"Federal Reserve" OR inflation OR earnings OR "analyst rating" OR "market outlook"'
  ];

  try {
    const results = await Promise.all(
      queries.map(query => fetchGNews(query, apiKey))
    );

    const allArticles = results.flat();

    const uniqueArticles = [];
    const seen = new Set();

    for (const article of allArticles) {
      const key = article.link || article.title;

      if (!key || seen.has(key)) continue;

      seen.add(key);
      uniqueArticles.push(article);
    }

    uniqueArticles.sort((a, b) => {
      return new Date(b.pubDate || 0) - new Date(a.pubDate || 0);
    });

    const articles = uniqueArticles.slice(0, 12);

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

async function fetchGNews(query, apiKey) {
  const url =
    "https://gnews.io/api/v4/search?q=" +
    encodeURIComponent(query) +
    "&lang=en" +
    "&country=us" +
    "&max=10" +
    "&sortby=publishedAt" +
    "&apikey=" +
    apiKey;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.log("GNews error:", data);
    return [];
  }

  return (data.articles || []).map(article => ({
    title: article.title || "Market News",
    link: article.url || "#",
    pubDate: article.publishedAt || "",
    source: article.source?.name || "Market News",
    image:
      article.image ||
      "https://images.unsplash.com/photo-1642790551116-18e150f248e6?auto=format&fit=crop&w=900&q=80"
  }));
}
