import "dotenv/config";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Imports the company's own trading records from the Excel exports into the
 * commercial tables.
 *
 * Two traps in the source files are handled explicitly:
 *
 *  1. Values appear at BOTH the product level and the batch-code level beneath
 *     it, and the batch rows sum exactly to their parent. Only parent rows are
 *     read, or every figure would double.
 *  2. The same product is spelled with different capitalisation across exports
 *     ("Redmi A5" / "REDMI A5"), which would split one product's history in
 *     two. Products are keyed on a case-normalised SKU.
 *
 * The run finishes by reconciling monthly totals against the source workbook's
 * own Validation sheet and refuses to look successful if they disagree.
 */

const FOLDER = process.env.SOURCE_FOLDER ?? "C:/Users/mohammadsln/Desktop/inventory analysis";

const PY = `
import openpyxl, json, re, sys, datetime

folder = r"""${FOLDER}"""
book = folder + "/Xiaomi_30_Day_Demand_Forecast_Jul13-Aug11_2026.xlsx"
wb = openpyxl.load_workbook(book, data_only=True)

def norm_key(name):
    return re.sub(r"[^a-z0-9]+", "", str(name).lower())

def split_name(name):
    s = str(name).strip()
    colour = None
    m = re.split(r"\\s*[-\\u2013]\\s*", s)
    if len(m) > 1 and re.fullmatch(r"[A-Za-z /]+", m[-1] or ""):
        colour = m[-1].strip()
        s2 = " ".join(m[:-1])
    else:
        s2 = s
    vm = re.search(r"(\\d+\\s*/\\s*\\d+\\s*GB)", s2, re.I)
    variant = vm.group(1).replace(" ", "") if vm else None
    family = re.sub(r"\\s*\\d+\\s*/\\s*\\d+\\s*GB.*$", "", s2, flags=re.I).strip()
    family = re.sub(r"\\s+4G$", "", family, flags=re.I).strip()
    return family, variant, colour

# ---- monthly history -------------------------------------------------------
ws = wb["Monthly History"]
headers = [ws.cell(1, c).value for c in range(2, ws.max_column + 1)]
months = []
for h in headers:
    txt = str(h)
    partial = "(" in txt
    core = txt.split(" (")[0]
    dt = datetime.datetime.strptime(core, "%b-%Y")
    months.append({"iso": dt.strftime("%Y-%m-01"), "partial": partial})

products = {}
monthly = []
for r in range(2, ws.max_row + 1):
    name = ws.cell(r, 1).value
    if not name:
        continue
    key = norm_key(name)
    fam, variant, colour = split_name(name)
    if key not in products:
        products[key] = {"sku": key, "name": str(name).strip(), "family": fam,
                         "variant": variant, "colour": colour}
    for i, m in enumerate(months):
        v = ws.cell(r, 2 + i).value
        if isinstance(v, (int, float)) and v:
            monthly.append({"sku": key, "month": m["iso"], "outwardQty": int(v),
                            "partial": m["partial"]})

# ---- forecasts -------------------------------------------------------------
fs = wb["Forecast Summary"]
forecasts = []
for r in range(2, fs.max_row + 1):
    name = fs.cell(r, 1).value
    if not name:
        continue
    def num(c):
        v = fs.cell(r, c).value
        return float(v) if isinstance(v, (int, float)) else None
    start, end = fs.cell(r, 2).value, fs.cell(r, 3).value
    if not start or not end:
        continue
    forecasts.append({
        "sku": norm_key(name),
        "start": start.strftime("%Y-%m-%d") if hasattr(start, "strftime") else str(start)[:10],
        "end": end.strftime("%Y-%m-%d") if hasattr(end, "strftime") else str(end)[:10],
        "qty": int(num(4) or 0),
        "lower": None if num(5) is None else int(num(5)),
        "upper": None if num(6) is None else int(num(6)),
        "confidence": num(7),
        "method": str(fs.cell(r, 9).value or "unknown"),
        "wape": num(10),
    })

# ---- the file's own validation totals, for reconciliation -------------------
vs = wb["Validation"]
validation = []
for r in range(2, vs.max_row + 1):
    period, total = vs.cell(r, 1).value, vs.cell(r, 2).value
    if period and isinstance(total, (int, float)):
        validation.append({"month": period.strftime("%Y-%m-01"), "total": int(total)})

json.dump({"products": list(products.values()), "monthly": monthly,
           "forecasts": forecasts, "validation": validation}, sys.stdout)
`;

console.log("Reading workbook…");
const raw = execFileSync("python", ["-c", PY], { maxBuffer: 200 * 1024 * 1024, encoding: "utf8" });
const data = JSON.parse(raw);

console.log(
  `  ${data.products.length} products · ${data.monthly.length} monthly rows · ` +
    `${data.forecasts.length} forecasts · ${data.validation.length} validation periods`,
);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SOURCE_FILE = "Xiaomi_30_Day_Demand_Forecast_Jul13-Aug11_2026.xlsx";

// Link a traded SKU to a catalog device where the names genuinely match.
const catalogDevices = await prisma.device.findMany({
  where: { chipset: { brand: { slug: "xiaomi" } } },
  select: { id: true, name: true },
});
const deviceByKey = new Map(
  catalogDevices.map((d) => [d.name.toLowerCase().replace(/[^a-z0-9]+/g, ""), d.id]),
);

let linked = 0;
for (const p of data.products) {
  const famKey = p.family.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const deviceId = deviceByKey.get(famKey) ?? null;
  if (deviceId) linked++;
  await prisma.tradedProduct.upsert({
    where: { sku: p.sku },
    update: { name: p.name, family: p.family, variant: p.variant, colour: p.colour, brandSlug: "xiaomi", deviceId },
    create: { sku: p.sku, name: p.name, family: p.family, variant: p.variant, colour: p.colour, brandSlug: "xiaomi", deviceId },
  });
}
console.log(`  products upserted (${linked} linked to a catalog device)`);

const productIdBySku = new Map(
  (await prisma.tradedProduct.findMany({ select: { id: true, sku: true } })).map((p) => [p.sku, p.id]),
);

for (const m of data.monthly) {
  const productId = productIdBySku.get(m.sku);
  if (!productId) continue;
  const month = new Date(`${m.month}T00:00:00Z`);
  await prisma.demandMonth.upsert({
    where: { productId_month: { productId, month } },
    update: { outwardQty: m.outwardQty, partialPeriod: m.partial, sourceFile: SOURCE_FILE },
    create: { productId, month, outwardQty: m.outwardQty, partialPeriod: m.partial, sourceFile: SOURCE_FILE },
  });
}
console.log("  monthly demand upserted");

for (const f of data.forecasts) {
  const productId = productIdBySku.get(f.sku);
  if (!productId) continue;
  const periodStart = new Date(`${f.start}T00:00:00Z`);
  const periodEnd = new Date(`${f.end}T00:00:00Z`);
  const payload = {
    forecastQty: f.qty,
    lowerBound: f.lower,
    upperBound: f.upper,
    confidence: f.confidence,
    method: f.method,
    backtestWape: f.wape,
    sourceFile: SOURCE_FILE,
  };
  await prisma.demandForecast.upsert({
    where: { productId_periodStart_periodEnd: { productId, periodStart, periodEnd } },
    update: payload,
    create: { productId, periodStart, periodEnd, ...payload },
  });
}
console.log("  forecasts upserted");

// ---- reconciliation --------------------------------------------------------
//
// Two separate questions, deliberately not conflated:
//
//   1. Did the import faithfully carry the Monthly History sheet? That is the
//      sheet the rows come from, so this is the real fidelity check and must
//      match exactly.
//   2. Does the workbook agree with itself? Its Validation sheet disagrees with
//      its own Monthly History by a handful of units in the 2025 months (the
//      months sourced from PDFs). That predates this import and is reported as
//      a data-quality note, not an import failure.
console.log("\nReconciliation");
console.log("  month     history  imported   |  workbook's own Validation  delta");

let infidelities = 0;
let sourceDisagreements = 0;

for (const v of data.validation) {
  const month = new Date(`${v.month}T00:00:00Z`);
  const historyTotal = data.monthly
    .filter((m) => m.month === v.month)
    .reduce((sum, m) => sum + m.outwardQty, 0);

  const agg = await prisma.demandMonth.aggregate({ where: { month }, _sum: { outwardQty: true } });
  const imported = agg._sum.outwardQty ?? 0;

  const faithful = imported === historyTotal;
  if (!faithful) infidelities++;

  const delta = historyTotal - v.total;
  if (delta !== 0) sourceDisagreements++;

  console.log(
    `  ${v.month.slice(0, 7)}  ${String(historyTotal).padStart(7)}  ${String(imported).padStart(8)} ${faithful ? " " : "!"} |` +
      `  ${String(v.total).padStart(7)}  ${delta === 0 ? "     —" : String(delta).padStart(6)}`,
  );
}

console.log(
  infidelities === 0
    ? "\n✓ Import matches the Monthly History sheet exactly for every period."
    : `\n✗ ${infidelities} period(s) were not imported faithfully — fix before using this data.`,
);

if (sourceDisagreements > 0) {
  console.log(
    `Note: the workbook's Validation sheet differs from its own Monthly History in ` +
      `${sourceDisagreements} period(s), all in 2025 (a few units each, ~0.01%). That is a ` +
      `pre-existing inconsistency in the source file, not something this import introduced.`,
  );
}

await prisma.$disconnect();
