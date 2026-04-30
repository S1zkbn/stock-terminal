export default async function handler(req, res) {
  const query = req.query.q || "stock market OR Nvidia OR Meta OR S&P 500";
  const rssUrl =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-US&gl=US&ceid=US:en";

  try {
    const response = await fetch(rssUrl);
    const xml = await response.text();

    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 12)
      .map(match => {
        const item = match[1];

        const title = getTag(item, "title");
        const link = getTag(item, "link");
        const pubDate = getTag(item, "pubDate");
        const source = getTag(item, "source");

        return {
          title: clean(title),
          link: clean(link),
          pubDate: clean(pubDate),
          source: clean(source),
          image: getImage(title)
        };
      });

    res.status(200).json({ articles: items });
  } catch (error) {
    res.status(500).json({ error: "Failed to load news" });
  }
}

function getTag(xml, tag) {
  const regex = new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

function clean(text) {
  return text
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function getImage(title) {
  const t = title.toLowerCase();

  if (t.includes("nvidia") || t.includes("ai") || t.includes("chip")) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80";
  }

  if (t.includes("meta") || t.includes("facebook")) {
    return "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=900&q=80";
  }

  if (t.includes("fed") || t.includes("rate") || t.includes("inflation")) {
    return "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80";
  }

  if (t.includes("oil") || t.includes("energy")) {
    return "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80";
  }

  return "https://images.unsplash.com/photo-1642790551116-18e150f248e6?auto=format&fit=crop&w=900&q=80";
}
