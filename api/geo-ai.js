export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.vercel.app",
        "X-Title": "GeoGuessr Coach"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "You are a GeoGuessr coach. Give concise, practical tips about country identification, roads, signs, languages, poles, bollards, license plates, vegetation, and strategy."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenRouter error",
        details: data
      });
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(200).json({
        reply: "No response text returned.",
        details: data
      });
    }

    return res.status(200).json({ reply: text });
  } catch (error) {
    return res.status(500).json({
      error: "AI request failed",
      details: String(error)
    });
  }
}
