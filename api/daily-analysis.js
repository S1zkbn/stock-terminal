let cache = null;
let cacheDate = null;

export default async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);

  if (cache && cacheDate === today && req.query.refresh !== "1") {
    return res.status(200).json({ analysis: cache });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing OPENROUTER_API_KEY"
    });
  }

  const prompt = `
You are a professional US stock market analyst.

Return ONLY valid JSON.
Do not use markdown.
Do not use code blocks.
Do not write \`\`\`json.

Use this exact structure:

{
  "market": "Analyze the overall US stock market today. Mention indexes, rates, macro conditions, and general direction.",
  "sentiment": "Analyze current market sentiment, risk appetite, volatility, and investor mood.",
  "individualStocks": "Analyze notable individual stocks including META, NVDA, TSLA, AAPL, MSFT, IREN, RKLB, PRCT.",
  "watchlistFocus": "Analyze this watchlist: CMG, META, BROS, DKNG, LKNCY, RDDT, PRCT, IREN, RKLB.",
  "stocksToWatch": ["Ticker - reason", "Ticker - reason", "Ticker - reason"],
  "underratedStocks": ["Ticker - reason it may be underappreciated", "Ticker - reason", "Ticker - reason"],
  "risks": "Main short-term market risks to watch."
}

Do not give direct financial advice.
Keep it readable, concise, and professional.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.vercel.app",
        "X-Title": "Market Daily Brief"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "OpenRouter error",
        details: data
      });
    }

    let text = data?.choices?.[0]?.message?.content || "";

    if (!text) {
      return res.status(500).json({
        error: "AI returned empty response",
        details: data
      });
    }

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text
      });
    }

    parsed = {
      market: parsed.market || "Market analysis unavailable.",
      sentiment: parsed.sentiment || "Sentiment analysis unavailable.",
      individualStocks: parsed.individualStocks || "Individual stock analysis unavailable.",
      watchlistFocus: parsed.watchlistFocus || "Watchlist analysis unavailable.",
      stocksToWatch: Array.isArray(parsed.stocksToWatch) ? parsed.stocksToWatch : [],
      underratedStocks: Array.isArray(parsed.underratedStocks) ? parsed.underratedStocks : [],
      risks: parsed.risks || "Risk analysis unavailable."
    };

    cache = parsed;
    cacheDate = today;

    return res.status(200).json({
      analysis: parsed
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate analysis",
      details: String(error)
    });
  }
}
