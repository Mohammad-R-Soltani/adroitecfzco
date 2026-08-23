-- CreateEnum
CREATE TYPE "BenchmarkFamily" AS ENUM ('GEEKBENCH_5', 'GEEKBENCH_6', 'ANTUTU_V9', 'ANTUTU_V10', 'ANTUTU_V11', 'THREEDMARK_WILD_LIFE', 'THREEDMARK_WILD_LIFE_EXTREME', 'THREEDMARK_STEEL_NOMAD_LIGHT', 'THREEDMARK_STEEL_NOMAD');

-- CreateEnum
CREATE TYPE "BenchmarkMetric" AS ENUM ('SINGLE_CORE', 'MULTI_CORE', 'TOTAL', 'CPU_SCORE', 'GPU_SCORE', 'MEM_SCORE', 'UX_SCORE', 'SCORE', 'FPS');

-- CreateTable
CREATE TABLE "DeviceBenchmark" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "family" "BenchmarkFamily" NOT NULL,
    "metric" "BenchmarkMetric" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "testedVariant" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDate" TEXT,
    "researchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DeviceBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceBenchmark_deviceId_family_metric_idx" ON "DeviceBenchmark"("deviceId", "family", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceBenchmark_deviceId_family_metric_sourceUrl_key" ON "DeviceBenchmark"("deviceId", "family", "metric", "sourceUrl");

-- AddForeignKey
ALTER TABLE "DeviceBenchmark" ADD CONSTRAINT "DeviceBenchmark_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
