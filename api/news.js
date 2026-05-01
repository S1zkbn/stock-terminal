export default async function handler(req, res) {
  const query = req.query.q || "stock market OR Nvidia OR Meta OR S&P 500";
  const rssUrl =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-US&gl=US&ceid=US:en";

  try {
    const response = await fetch(rssUrl);
    const xml = await response.text();

    const rawItems = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12);

    const articles = await Promise.all(
      rawItems.map(async (match, index) => {
        const item = match[1];

        const title = clean(getTag(item, "title"));
        const link = clean(getTag(item, "link"));
        const pubDate = clean(getTag(item, "pubDate"));
        const source = clean(getTag(item, "source"));

        // ⭐ 核心：优先真实封面
        const articleImage = await getArticleImage(link);

        return {
          title,
          link,
          pubDate,
          source,
          image: articleImage || getSmartImage(title, index)
        };
      })
    );

    res.status(200).json({ articles });

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

async function getArticleImage(url) {
  try {
    // ⭐ 关键：用代理绕过网站限制
    const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);

    const response = await fetch(proxy);
    const html = await response.text();

    // 1️⃣ 优先 og:image
    const og =
      html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (og && og[1]) {
      const img = og[1];

      // ❌ 过滤垃圾图
      if (
        img.includes("logo") ||
        img.includes("icon") ||
        img.includes("avatar")
      ) return null;

      return img;
    }

    // 2️⃣ 备用 twitter:image
    const twitter =
      html.match(/name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

    if (twitter && twitter[1]) {
      return twitter[1];
    }

    return null;

  } catch (e) {
    return null;
  }
}

function getSmartImage(title, index = 0) {
  const t = title.toLowerCase();

  if (t.includes("nvidia") || t.includes("ai") || t.includes("chip")) {
    return images.ai[index % images.ai.length];
  }

  if (t.includes("meta") || t.includes("facebook")) {
    return images.social[index % images.social.length];
  }

  if (t.includes("fed") || t.includes("rate") || t.includes("inflation")) {
    return images.macro[index % images.macro.length];
  }

  if (t.includes("oil") || t.includes("energy")) {
    return images.energy[index % images.energy.length];
  }

  if (t.includes("earnings") || t.includes("analyst")) {
    return images.analysis[index % images.analysis.length];
  }

  return images.market[index % images.market.length];
}

const images = {
  market: [
    "https://images.unsplash.com/photo-1642790551116-18e150f248e6?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=900&q=80"
  ],
  ai: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80"
  ],
  social: [
    "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=900&q=80"
  ],
  macro: [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
  ],
  energy: [
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80"
  ],
  analysis: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"
  ]
};
