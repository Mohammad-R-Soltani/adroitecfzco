import "server-only";
import { XMLParser } from "fast-xml-parser";

export type FeedItem = {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  imageUrl: string | null;
  /** Short lead paragraph pulled from the feed itself. */
  summary: string | null;
  /** A few key sentences from the article body, for the in-app reader. */
  keyPoints: string[];
};

const parser = new XMLParser({ ignoreAttributes: false });

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, "").trim();
}

function firstImageFromHtml(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Splits feed body text into a lead paragraph plus a few key sentences. */
function extractReadable(raw: string | undefined): { summary: string | null; keyPoints: string[] } {
  if (!raw) return { summary: null, keyPoints: [] };

  const text = decodeEntities(stripHtml(String(raw)))
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 40) return { summary: null, keyPoints: [] };

  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  const summary = sentences[0] ?? text.slice(0, 220);
  const keyPoints = sentences.slice(1, 5);

  return { summary, keyPoints };
}

type AtomLink = { "@_href"?: string; "@_rel"?: string };

async function fetchFeed(url: string, source: string): Promise<FeedItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "adroitecfzco-internal-tool/1.0 (internal sales enablement app)" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const data = parser.parse(xml);

    // RSS 2.0: <rss><channel><item>...
    if (data?.rss?.channel?.item) {
      const items = data.rss.channel.item;
      const list = Array.isArray(items) ? items : [items];
      return list
        .map((item): FeedItem | null => {
          const title = typeof item.title === "string" ? stripHtml(item.title) : null;
          const link = typeof item.link === "string" ? item.link : null;
          const pubDate = item.pubDate ? new Date(item.pubDate) : null;
          if (!title || !link || !pubDate || Number.isNaN(pubDate.getTime())) return null;
          const imageUrl = firstImageFromHtml(item.description);
          const { summary, keyPoints } = extractReadable(item.description);
          return { title, link, pubDate, source, imageUrl, summary, keyPoints };
        })
        .filter((x): x is FeedItem => x !== null);
    }

    // Atom: <feed><entry>...
    if (data?.feed?.entry) {
      const entries = data.feed.entry;
      const list = Array.isArray(entries) ? entries : [entries];
      return list
        .map((entry): FeedItem | null => {
          const title = typeof entry.title === "string" ? stripHtml(entry.title) : null;
          const links: AtomLink[] = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : [];
          const link = links.find((l) => l["@_rel"] !== "enclosure")?.["@_href"] ?? null;
          const imageUrl = links.find((l) => l["@_rel"] === "enclosure")?.["@_href"] ?? null;
          const dateStr = entry.published ?? entry.updated ?? null;
          const pubDate = dateStr ? new Date(dateStr) : null;
          if (!title || !link || !pubDate || Number.isNaN(pubDate.getTime())) return null;
          const { summary, keyPoints } = extractReadable(entry.content ?? entry.summary);
          return { title, link, pubDate, source, imageUrl, summary, keyPoints };
        })
        .filter((x): x is FeedItem => x !== null);
    }

    return [];
  } catch {
    return [];
  }
}

export async function getIndustryUpdates(limit = 10): Promise<FeedItem[]> {
  const [gsmarena, appleNewsroom] = await Promise.all([
    fetchFeed("https://www.gsmarena.com/rss-news-reviews.php3", "GSMArena"),
    fetchFeed("https://www.apple.com/newsroom/rss-feed.rss", "Apple Newsroom"),
  ]);

  return [...gsmarena, ...appleNewsroom]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, limit);
}
