import { fetchDevicePage } from "./gsmarena.mjs";

/**
 * Parses a GSMArena brand listing page into device stubs.
 *
 * Each <li> carries everything needed to decide whether the device is worth
 * fetching in full: the spec-page URL, the product photo, the model name, and
 * an "Announced <Mon> <Year>" phrase inside the tooltip. Filtering on that year
 * here means the importer only pulls detail pages it actually intends to keep.
 */
export function parseBrandListing(html) {
  const re =
    /<li><a href="([^"]+)"><img src=([^\s>]+)[^>]*title="([^"]*)"[^>]*><strong><span>([^<]+)<\/span>/g;

  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const [, path, image, tooltip, name] = m;
    const yearMatch = tooltip.match(/Announced\s+\w+\s+(\d{4})/i);
    const notAnnounced = /not announced yet|cancelled/i.test(tooltip);
    // The tooltip opens "<Brand> <Model> <type>." — the only place the listing
    // states whether this is a phone, a tablet or a watch.
    const typeMatch = tooltip.match(/\b(smartphone|tablet|smartwatch|smartband)\b/i);
    const category =
      {
        smartphone: "PHONE",
        tablet: "TABLET",
        smartwatch: "WATCH",
        smartband: "WATCH",
      }[typeMatch?.[1]?.toLowerCase()] ?? null;

    out.push({
      url: `https://www.gsmarena.com/${path}`,
      image: image.replace(/^["']|["']$/g, ""),
      name: name.trim(),
      announcedYear: yearMatch ? Number(yearMatch[1]) : null,
      cancelled: notAnnounced,
      category,
    });
  }
  return out;
}

/**
 * The pager's own page links, read straight out of the markup rather than
 * reconstructed — GSMArena's paging URL shape is not what it looks like
 * ("apple-phones-f-48-0-p2.php"), so guessing it produces 404s.
 */
export function parsePagerLinks(html) {
  const nav = html.match(/<div class="nav-pages">([\s\S]*?)<\/div>/);
  if (!nav) return [];
  const hrefs = [...nav[1].matchAll(/href="([^"#]+\.php)"/g)].map((m) => m[1]);
  return [...new Set(hrefs)];
}

/**
 * Walks every page of a brand listing and returns the device stubs released in
 * `minYear` or later. Paced politely — GSMArena rate-limits aggressively.
 */
export async function listBrandDevices(firstPageUrl, { minYear, delayMs = 1500 } = {}) {
  const firstHtml = await fetchDevicePage(firstPageUrl);

  let all = parseBrandListing(firstHtml);

  // Follow the pager outward, collecting any further page links each page
  // reveals, until nothing new appears.
  const origin = "https://www.gsmarena.com/";
  const queue = parsePagerLinks(firstHtml);
  const visited = new Set([firstPageUrl.replace(origin, "")]);

  while (queue.length) {
    const path = queue.shift();
    if (visited.has(path)) continue;
    visited.add(path);

    await new Promise((r) => setTimeout(r, delayMs));
    try {
      const html = await fetchDevicePage(origin + path);
      all = all.concat(parseBrandListing(html));
      for (const next of parsePagerLinks(html)) {
        if (!visited.has(next)) queue.push(next);
      }
    } catch (err) {
      console.log(`  ! ${path} failed (${err.message}) — continuing`);
    }
  }

  const seen = new Set();
  return all.filter((d) => {
    if (d.cancelled) return false;
    if (minYear != null && (d.announcedYear == null || d.announcedYear < minYear)) return false;
    if (seen.has(d.url)) return false;
    seen.add(d.url);
    return true;
  });
}
