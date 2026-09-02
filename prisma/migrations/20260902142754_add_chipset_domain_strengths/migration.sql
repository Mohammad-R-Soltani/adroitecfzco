-- CreateEnum
CREATE TYPE "ChipsetDomain" AS ENUM ('ON_DEVICE_AI', 'GAMING_GPU', 'RAY_TRACING', 'CAMERA_ISP', 'POWER_EFFICIENCY', 'SUSTAINED_PERFORMANCE', 'RAW_CPU', 'CONNECTIVITY');

-- CreateEnum
CREATE TYPE "DomainLevel" AS ENUM ('LEADING', 'STRONG');

-- CreateTable
CREATE TABLE "ChipsetDomainStrength" (
    "id" TEXT NOT NULL,
    "chipsetId" TEXT NOT NULL,
    "domain" "ChipsetDomain" NOT NULL,
    "level" "DomainLevel" NOT NULL,
    "evidence" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,

    CONSTRAINT "ChipsetDomainStrength_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChipsetDomainStrength_domain_level_idx" ON "ChipsetDomainStrength"("domain", "level");

-- CreateIndex
CREATE UNIQUE INDEX "ChipsetDomainStrength_chipsetId_domain_key" ON "ChipsetDomainStrength"("chipsetId", "domain");

-- AddForeignKey
ALTER TABLE "ChipsetDomainStrength" ADD CONSTRAINT "ChipsetDomainStrength_chipsetId_fkey" FOREIGN KEY ("chipsetId") REFERENCES "Chipset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
