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
Write a concise daily US stock market analysis for a personal finance dashboard.

Include:
1. Market mood
2. Tech / AI sector
3. Watchlist focus: META, CMG, BROS, DKNG, LKNCY, RDDT, PRCT, IREN, RKLB
4. Main risks
5. Short-term outlook

Do not give direct financial advice. Keep it professional and easy to read.
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

    const text =
      data?.choices?.[0]?.message?.content ||
      "Daily analysis is temporarily unavailable.";

    cache = text;
    cacheDate = today;

    return res.status(200).json({ analysis: text });
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate analysis" });
  }
}