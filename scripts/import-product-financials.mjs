import "dotenv/config";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Imports what each product cost and sold for, from the stock ledger's Group
 * Summary export.
 *
 * The sheet nests batch rows under their product, and the batch rows sum
 * exactly to the parent — here the two levels are told apart by cell
 * indentation (indent 0 = product, indent 4 = batch), which is the only signal
 * this particular export carries.
 *
 * Rates are the ledger's own effective (weighted-average) rates for the whole
 * period, so they are a realised average across the batches actually traded,
 * not a list price on any given day.
 */

const FOLDER = process.env.SOURCE_FOLDER ?? "C:/Users/mohammadsln/Desktop/inventory analysis";
const SOURCE_FILE = "Xiaomi Stock Summary.xlsx";

const PY = `
import openpyxl, json, sys, re

wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
ws = wb.worksheets[0]

# Row 4 states the period the summary covers, e.g. "1-Jan-26 to 12-Jul-26".
period = None
for r in range(1, 8):
    v = ws.cell(r, 1).value
    if v and re.search(r"\\d{1,2}-\\w{3}-\\d{2}\\s+to\\s+\\d{1,2}-\\w{3}-\\d{2}", str(v)):
        period = str(v).strip()
        break

def num(r, c):
    v = ws.cell(r, c).value
    return float(v) if isinstance(v, (int, float)) else None

rows = []
for r in range(8, ws.max_row + 1):
    cell = ws.cell(r, 1)
    name = cell.value
    if not name:
        continue
    # Batch rows are indented beneath their product and sum to it; counting
    # both would double every figure.
    if (cell.alignment.indent or 0) > 0:
        continue
    if str(name).strip().lower() in ("grand total", "total"):
        continue

    rows.append({
        "product": str(name).strip(),
        "inwardQty": num(r, 6), "purchaseRate": num(r, 7), "inwardValue": num(r, 8),
        "outwardQty": num(r, 9), "saleRate": num(r, 10), "outwardValue": num(r, 11),
        "consumption": num(r, 13),
        "grossProfit": num(r, 14), "marginPercent": num(r, 15),
        "closingQty": num(r, 16),
    })

json.dump({"period": period, "rows": rows}, sys.stdout)
`;

console.log("Reading stock summary…");
const raw = execFileSync("python", ["-c", PY, `${FOLDER}/${SOURCE_FILE}`], {
  maxBuffer: 200 * 1024 * 1024,
  encoding: "utf8",
});
const { period, rows } = JSON.parse(raw);

const match = String(period ?? "").match(/(\d{1,2}-\w{3}-\d{2})\s+to\s+(\d{1,2}-\w{3}-\d{2})/);
if (!match) throw new Error(`Could not read the period from the sheet (got ${period})`);

function tallyDate(text) {
  const m = text.match(/(\d{1,2})-(\w{3})-(\d{2})/);
  const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  return new Date(Date.UTC(2000 + Number(m[3]), months[m[2].toLowerCase()], Number(m[1])));
}
const periodStart = tallyDate(match[1]);
const periodEnd = tallyDate(match[2]);
console.log(`  period ${match[1]} to ${match[2]} · ${rows.length} product rows`);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const normKey = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
const productIdBySku = new Map(
  (await prisma.tradedProduct.findMany({ select: { id: true, sku: true } })).map((p) => [p.sku, p.id]),
);

let written = 0;
let skipped = 0;
let withBothRates = 0;

for (const row of rows) {
  const productId = productIdBySku.get(normKey(row.product));
  if (!productId) {
    skipped++;
    continue;
  }
  const data = {
    inwardQty: row.inwardQty != null ? Math.round(row.inwardQty) : null,
    purchaseRate: row.purchaseRate,
    inwardValue: row.inwardValue,
    outwardQty: row.outwardQty != null ? Math.round(row.outwardQty) : null,
    saleRate: row.saleRate,
    outwardValue: row.outwardValue,
    consumptionValue: row.consumption,
    // Cost of what actually sold, per unit — the figure comparable to saleRate.
    costPerUnitSold:
      row.consumption != null && row.outwardQty ? row.consumption / row.outwardQty : null,
    grossProfit: row.grossProfit,
    marginPercent: row.marginPercent,
    closingQty: row.closingQty != null ? Math.round(row.closingQty) : null,
    sourceFile: SOURCE_FILE,
  };
  await prisma.productFinancials.upsert({
    where: { productId_periodStart_periodEnd: { productId, periodStart, periodEnd } },
    update: data,
    create: { productId, periodStart, periodEnd, ...data },
  });
  written++;
  if (row.purchaseRate && row.saleRate) withBothRates++;
}

// Sanity check: a sale rate below its purchase rate means the margin is
// negative, which happens but is worth surfacing rather than passing over.
const negative = await prisma.productFinancials.count({ where: { marginPercent: { lt: 0 } } });

console.log(`\n${written} product financial rows written (${withBothRates} with both a purchase and a sale rate).`);
if (skipped) console.log(`${skipped} row(s) had no matching traded product and were skipped.`);
if (negative) console.log(`${negative} product(s) show a negative margin over the period — worth a look.`);

await prisma.$disconnect();
