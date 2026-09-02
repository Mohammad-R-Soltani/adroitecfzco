-- CreateEnum
CREATE TYPE "ChipsetKind" AS ENUM ('MOBILE_SOC', 'LAPTOP_SOC', 'WEARABLE_SOC', 'AUDIO_CHIP');

-- AlterEnum
ALTER TYPE "BrandSlug" ADD VALUE 'samsung';

-- AlterEnum
ALTER TYPE "DeviceCategory" ADD VALUE 'EARBUDS';

-- AlterTable
ALTER TABLE "Chipset" ADD COLUMN     "competitiveEdge" TEXT,
ADD COLUMN     "competitiveEdgeSourceName" TEXT,
ADD COLUMN     "competitiveEdgeSourceUrl" TEXT,
ADD COLUMN     "kind" "ChipsetKind" NOT NULL DEFAULT 'MOBILE_SOC';

-- CreateTable
CREATE TABLE "ChipsetSpecSource" (
    "id" TEXT NOT NULL,
    "chipsetId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChipsetSpecSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChipsetSpecSource_chipsetId_sourceUrl_key" ON "ChipsetSpecSource"("chipsetId", "sourceUrl");

-- AddForeignKey
ALTER TABLE "ChipsetSpecSource" ADD CONSTRAINT "ChipsetSpecSource_chipsetId_fkey" FOREIGN KEY ("chipsetId") REFERENCES "Chipset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
