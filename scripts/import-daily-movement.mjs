import "dotenv/config";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Imports day-level stock movement from the monthly exports — the xlsx files
 * for Jan/Feb/Mar/May and the PDF files for April/June/July.
 *
 * In both formats a batch/lot sub-row is marked by carrying a location
 * ("Main Location") beside its code, and those rows sum exactly to the product
 * row above them. Filtering on the location marker rather than on the shape of
 * the code is what makes this correct: batch codes are sometimes numeric
 * ("1628") and sometimes not ("P222", "DM"), so a numeric-only rule silently
 * lets half of them through and doubles every figure.
 *
 * Every file is reconciled against the month total the demand workbook reports
 * for the same period before anything is written.
 */

const FOLDER = process.env.SOURCE_FOLDER ?? "C:/Users/mohammadsln/Desktop/inventory analysis";

/** Month totals from the demand workbook's Monthly History — the check target. */
const EXPECTED = {
  "2026-01": 41745,
  "2026-02": 70824,
  "2026-03": 10249,
  "2026-04": 18040,
  "2026-05": 25304,
  "2026-06": 52446,
  "2026-07": 16893,
};

const XLSX_FILES = [
  ["january Stock movement .xlsx", "2026-01"],
  ["Feb Stock movement .xlsx", "2026-02"],
  ["March Stock Movement.xlsx", "2026-03"],
  ["May Stock Movement.xlsx", "2026-05"],
];

const PDF_FILES = [
  ["April stock Movement.pdf", "2026-04"],
  ["june stock movement.pdf", "2026-06"],
  ["July stock movement.pdf", "2026-07"],
];

const PY_XLSX = `
import openpyxl, json, sys, re, datetime
path = sys.argv[1]
wb = openpyxl.load_workbook(path, data_only=True)
ws = wb.worksheets[0]

# Row 10 holds "For 1-Jan-26" every 6 columns; row 11 marks Inward / Outward.
day_cols = {}
for c in range(3, ws.max_column + 1):
    v = ws.cell(10, c).value
    if v and str(v).startswith("For "):
        day_cols[c] = str(v)[4:]

groups = []
for start, label in day_cols.items():
    inward = outward = None
    for c in range(start, min(start + 6, ws.max_column + 1)):
        kind = ws.cell(11, c).value
        if kind == "Inward":
            inward = c
        elif kind == "Outward":
            outward = c
    groups.append({"date": label, "inward": inward, "outward": outward})

rows = []
for r in range(12, ws.max_row + 1):
    name = ws.cell(r, 1).value
    if not name:
        continue
    # A batch/lot row carries a location; the product row above it does not.
    if ws.cell(r, 2).value:
        continue
    # The sheet ends with a Grand Total row that also has no location, so it
    # would pass the check above and silently double every figure.
    if str(name).strip().lower() in ("grand total", "total"):
        continue
    for g in groups:
        def val(col, offset):
            if col is None:
                return None
            v = ws.cell(r, col + offset).value
            return float(v) if isinstance(v, (int, float)) else None
        in_q, in_r, in_v = val(g["inward"], 0), val(g["inward"], 1), val(g["inward"], 2)
        out_q, out_r, out_v = val(g["outward"], 0), val(g["outward"], 1), val(g["outward"], 2)
        if not any(x for x in (in_q, out_q)):
            continue
        rows.append({"date": g["date"], "product": str(name).strip(),
                     "inwardQty": in_q, "inwardRate": in_r, "inwardValue": in_v,
                     "outwardQty": out_q, "outwardRate": out_r, "outwardValue": out_v})

json.dump(rows, sys.stdout)
`;

function parseTallyDate(text) {
  // "1-Jan-26" -> 2026-01-01
  const m = String(text).match(/(\d{1,2})-(\w{3})-(\d{2})/);
  if (!m) return null;
  const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const mi = months[m[2].toLowerCase()];
  if (mi === undefined) return null;
  return new Date(Date.UTC(2000 + Number(m[3]), mi, Number(m[1])));
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const productIdBySku = new Map(
  (await prisma.tradedProduct.findMany({ select: { id: true, sku: true } })).map((p) => [p.sku, p.id]),
);
const normKey = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Splits a Tally item name into family, storage variant and colour. */
function splitName(raw) {
  const s = String(raw).trim();
  const parts = s.split(/\s*[-–]\s*/);
  let colour = null;
  let rest = s;
  if (parts.length > 1 && /^[A-Za-z /]+$/.test(parts[parts.length - 1])) {
    colour = parts[parts.length - 1].trim();
    rest = parts.slice(0, -1).join(" ");
  }
  const variantMatch = rest.match(/(\d+\s*[/+]\s*\d+\s*GB)/i);
  const variant = variantMatch ? variantMatch[1].replace(/\s+/g, "") : null;
  const family = rest
    .replace(/\d+\s*[/+]\s*\d+\s*GB.*$/i, "")
    .replace(/\s+(4G|5G)$/i, "")
    .trim();
  return { family: family || rest.trim(), variant, colour };
}

async function createProduct(name) {
  const { family, variant, colour } = splitName(name);
  return prisma.tradedProduct.create({
    data: {
      sku: normKey(name),
      name: String(name).trim(),
      family,
      variant,
      colour,
      brandSlug: "xiaomi",
    },
  });
}

let totalRows = 0;
let unmatched = new Set();
const report = [];

async function ingest(rows, sourceFile, monthKey, { daily }) {
  const extracted = rows.reduce((sum, r) => sum + (r.outwardQty ?? 0), 0);
  const expected = EXPECTED[monthKey];
  const matches = expected != null && Math.round(extracted) === expected;
  report.push({ sourceFile, monthKey, extracted: Math.round(extracted), expected, matches });
  if (!matches) return 0;

  let written = 0;
  for (const r of rows) {
    let productId = productIdBySku.get(normKey(r.product));

    // The movement files run later than the forecast workbook, so they carry
    // products it never saw (POCO F8, Xiaomi 17 Ultra…). Those are real traded
    // products and are created here rather than dropped.
    if (!productId) {
      const created = await createProduct(r.product);
      productId = created.id;
      productIdBySku.set(normKey(r.product), productId);
      unmatched.add(r.product);
    }
    const date = parseTallyDate(r.date ?? r.periodStart);
    if (!date) continue;

    const payload = {
      inwardQty: r.inwardQty != null ? Math.round(r.inwardQty) : null,
      inwardValue: r.inwardValue ?? null,
      outwardQty: Math.round(r.outwardQty ?? 0),
      outwardValue: r.outwardValue ?? null,
      sourceFile,
    };

    // Only genuinely per-day files land in DemandDay. The July export is a
    // 12-day total, which would be a lie at day grain, so it is skipped here —
    // its month is already carried by DemandMonth.
    if (!daily) continue;

    await prisma.demandDay.upsert({
      where: { productId_date: { productId, date } },
      update: payload,
      create: { productId, date, ...payload },
    });
    written++;
  }
  return written;
}

for (const [file, monthKey] of XLSX_FILES) {
  const raw = execFileSync("python", ["-c", PY_XLSX, `${FOLDER}/${file}`], {
    maxBuffer: 200 * 1024 * 1024,
    encoding: "utf8",
  });
  totalRows += await ingest(JSON.parse(raw), file, monthKey, { daily: true });
}

for (const [file, monthKey] of PDF_FILES) {
  const raw = execFileSync("python", ["scripts/extract-pdf-movement.py", `${FOLDER}/${file}`], {
    maxBuffer: 200 * 1024 * 1024,
    encoding: "utf8",
  });
  const rows = JSON.parse(raw);
  // July spans 1–12 Jul in one report rather than per day.
  const daily = rows.every((r) => r.periodStart === r.periodEnd);
  totalRows += await ingest(rows, file, monthKey, { daily });
}

console.log("Reconciliation against the demand workbook's month totals:\n");
console.log("  file                              month    extracted   expected");
for (const r of report) {
  console.log(
    `  ${r.sourceFile.padEnd(32)} ${r.monthKey}  ${String(r.extracted).padStart(9)}  ${String(r.expected ?? "?").padStart(9)}  ${r.matches ? "match" : "MISMATCH — not imported"}`,
  );
}

console.log(`\n${totalRows} day-level rows written.`);
if (unmatched.size) {
  console.log(`\n${unmatched.size} product name(s) were not in the forecast workbook and were created from the movement files:`);
  [...unmatched].slice(0, 12).forEach((n) => console.log(`  - ${n}`));
}

await prisma.$disconnect();
