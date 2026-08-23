const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

export async function fetchDevicePage(url, { retries = 4, baseDelayMs = 4000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429 && attempt < retries) {
      const wait = baseDelayMs * Math.pow(1.7, attempt);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
    const html = await res.text();
    if (html.includes("GSMArena Turnstile check")) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(1.7, attempt)));
        continue;
      }
      throw new Error(`blocked by Turnstile: ${url}`);
    }
    return html;
  }
  throw new Error(`exhausted retries for ${url}`);
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&deg;/g, "°")
    .replace(/&micro;/g, "µ")
    .replace(/&Aring;/g, "Å")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanValue(raw) {
  return decodeEntities(
    raw
      .replace(/<br\s*\/?>/gi, "; ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  ).replace(/(;\s*)+$/, "");
}

/** Parses the #specs-list table into { "Section Name": { "Row Label": "value" } }. */
export function parseSpecs(html) {
  const start = html.indexOf('id="specs-list"');
  const end = html.indexOf('id="specs-brief-accessories"', start);
  const region = html.slice(start, end > 0 ? end : start + 60000);

  const sections = {};
  let currentSection = null;

  const thRe = /<th[^>]*>([\s\S]*?)<\/th>/gi;
  const rowRe =
    /<td class="ttl">\s*(?:<a[^>]*>)?([^<]+?)(?:<\/a>)?\s*<\/td>\s*<td class="nfo"[^>]*>([\s\S]*?)<\/td>/gi;

  // Walk the region tag-by-tag so section headers (<th>) correctly scope
  // the rows that follow them.
  const thMatches = [...region.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)];
  const boundaries = thMatches.map((m) => ({ index: m.index, label: cleanValue(m[1]) }));
  boundaries.push({ index: region.length, label: null });

  for (let i = 0; i < boundaries.length - 1; i++) {
    const { index, label } = boundaries[i];
    const chunk = region.slice(index, boundaries[i + 1].index);
    currentSection = label;
    sections[currentSection] ??= {};

    let m;
    rowRe.lastIndex = 0;
    while ((m = rowRe.exec(chunk))) {
      const key = cleanValue(m[1]);
      const value = cleanValue(m[2]);
      if (key && value && !(key in sections[currentSection])) {
        sections[currentSection][key] = value;
      }
    }
  }

  return sections;
}

export function num(re, text) {
  if (!text) return null;
  const m = text.match(re);
  return m ? parseFloat(m[1]) : null;
}

/**
 * Parses the "Our Tests" -> "Performance" summary line GSMArena prints on a
 * device's own spec page, e.g.:
 *   "AnTuTu: 2600583 (v10), 2331417 (v11); GeekBench: 10118 (v6); 3DMark: 6010 (Wild Life Extreme)"
 * Cross-checked against GSMArena's own review benchmark tables: the single
 * GeekBench figure GSMArena prints here is the Multi-core score.
 * Returns a list of { family, metric, value } rows — never invents a value
 * for a family/metric the string doesn't mention.
 */
export function parsePerformanceLine(text) {
  if (!text) return [];
  const rows = [];

  const antutuRe = /(\d{4,9})\s*\(v(\d+)\)/gi;
  const antutuSection = text.match(/AnTuTu:\s*([^;]+)/i)?.[1];
  if (antutuSection) {
    let m;
    while ((m = antutuRe.exec(antutuSection))) {
      const version = m[2];
      const family = { "9": "ANTUTU_V9", "10": "ANTUTU_V10", "11": "ANTUTU_V11" }[version];
      if (family) rows.push({ family, metric: "TOTAL", value: parseFloat(m[1]) });
    }
  }

  const gbMatch = text.match(/GeekBench:\s*(\d{3,6})\s*\(v(\d)\)/i);
  if (gbMatch) {
    const family = gbMatch[2] === "6" ? "GEEKBENCH_6" : gbMatch[2] === "5" ? "GEEKBENCH_5" : null;
    if (family) rows.push({ family, metric: "MULTI_CORE", value: parseFloat(gbMatch[1]) });
  }

  const dmMatch = text.match(/3DMark:\s*(\d{3,7})\s*\(([^)]+)\)/i);
  if (dmMatch) {
    const testName = dmMatch[2].toLowerCase();
    const family = testName.includes("wild life extreme")
      ? "THREEDMARK_WILD_LIFE_EXTREME"
      : testName.includes("wild life")
        ? "THREEDMARK_WILD_LIFE"
        : testName.includes("steel nomad light")
          ? "THREEDMARK_STEEL_NOMAD_LIGHT"
          : testName.includes("steel nomad")
            ? "THREEDMARK_STEEL_NOMAD"
            : null;
    if (family) rows.push({ family, metric: "SCORE", value: parseFloat(dmMatch[1]) });
  }

  return rows;
}
