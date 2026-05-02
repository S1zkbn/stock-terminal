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
Return ONLY valid JSON. No markdown. No code block.

Use this exact structure:
{
  "market": "Brief overall market analysis.",
  "sentiment": "Brief market sentiment analysis.",
  "individualStocks": "Brief individual stock analysis.",
  "watchlistFocus": "Brief watchlist analysis for CMG, META, BROS, DKNG, LKNCY, RDDT, PRCT, IREN, RKLB.",
  "stocksToWatch": ["Ticker - reason", "Ticker - reason", "Ticker - reason"],
  "underratedStocks": ["Ticker - reason", "Ticker - reason", "Ticker - reason"],
  "risks": "Brief main risk analysis."
}

Do not give direct financial advice.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    let text =
      data?.choices?.[0]?.message?.content ||
      "";

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = {
        market: text || "Daily analysis temporarily unavailable.",
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

  } catch (error) {
    return res.status(500).json({ error: "Failed to generate analysis" });
  }
}
