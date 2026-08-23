import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fetchDevicePage, parseSpecs, parsePerformanceLine } from "./gsmarena.mjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const devices = await prisma.device.findMany({
    where: { spec: { isNot: null } },
    include: { spec: true },
    orderBy: { name: "asc" },
  });

  let devicesWithBench = 0;
  let totalRows = 0;
  const untested = [];

  for (const device of devices) {
    const url = device.spec.sourceUrl;
    if (!url) {
      untested.push(device.name);
      continue;
    }

    try {
      const html = await fetchDevicePage(url);
      const sections = parseSpecs(html);
      const perfLine = sections["Our Tests"]?.["Performance"];

      if (!perfLine) {
        console.log(`— ${device.name}: not lab-tested by GSMArena (no "Our Tests" section)`);
        untested.push(device.name);
      } else {
        const rows = parsePerformanceLine(perfLine);
        if (rows.length === 0) {
          console.log(`— ${device.name}: "Our Tests" present but unparsed ("${perfLine}")`);
          untested.push(device.name);
        } else {
          for (const row of rows) {
            await prisma.deviceBenchmark.upsert({
              where: {
                deviceId_family_metric_sourceUrl: {
                  deviceId: device.id,
                  family: row.family,
                  metric: row.metric,
                  sourceUrl: url,
                },
              },
              update: { value: row.value, sourceName: "GSMArena" },
              create: {
                deviceId: device.id,
                family: row.family,
                metric: row.metric,
                value: row.value,
                sourceName: "GSMArena",
                sourceUrl: url,
                notes: "GSMArena lab-tested performance summary, from the device's own spec page.",
              },
            });
            totalRows++;
          }
          console.log(`✓ ${device.name}: ${rows.map((r) => `${r.family}/${r.metric}=${r.value}`).join(", ")}`);
          devicesWithBench++;
        }
      }
    } catch (e) {
      console.log(`✗ ${device.name}: ${e.message}`);
      untested.push(device.name);
    }

    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log(`\n${devicesWithBench}/${devices.length} devices got real benchmark rows (${totalRows} rows total).`);
  console.log(`\nNo verified benchmark data found for:\n - ${untested.join("\n - ")}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
