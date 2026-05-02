let cache = null;
let cacheDate = null;

export default async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);

  if (cache && cacheDate === today) {
    return res.status(200).json({ analysis: cache });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  const prompt = `
Write a daily US stock market analysis for a personal finance dashboard.

Return ONLY valid JSON. No markdown.

Use this exact structure:
{
  "market": "Brief analysis of the overall market, indexes, rates, and macro conditions.",
  "sentiment": "Brief analysis of market sentiment, risk appetite, volatility, and liquidity.",
  "individualStocks": "Brief analysis of important individual stocks such as META, NVDA, TSLA, AAPL, MSFT, IREN, RKLB, PRCT.",
  "watchlistFocus": "Brief analysis of this watchlist: CMG, META, BROS, DKNG, LKNCY, RDDT, PRCT, IREN, RKLB.",
  "stocksToWatch": ["Ticker 1 - reason", "Ticker 2 - reason", "Ticker 3 - reason"],
  "risks": "Main short-term risks to watch."
  "underratedStocks": ["Ticker 1 - why it may be underappreciated", "Ticker 2 - reason", "Ticker 3 - reason"]
}

Do not give direct financial advice. Keep it professional, readable, and concise.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    let text =
  data?.choices?.[0]?.message?.content ||
  "";

let parsed;

try {
  parsed = JSON.parse(text);
} catch (e) {
  parsed = {
    market: text || "Daily analysis is temporarily unavailable.",
    sentiment: "Sentiment data unavailable.",
    individualStocks: "Individual stock analysis unavailable.",
    watchlistFocus: "Watchlist analysis unavailable.",
    stocksToWatch: [],
    underratedStocks: [],
    risks: "Risk analysis unavailable."
  };
}

cache = parsed;
cacheDate = today;

return res.status(200).json({ analysis: parsed });
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate analysis" });
  }
}
