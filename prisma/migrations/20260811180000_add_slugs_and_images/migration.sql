-- AlterTable
ALTER TABLE "Chipset" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "imageAttributionText" TEXT,
ADD COLUMN     "imageAttributionUrl" TEXT,
ADD COLUMN     "imageHeight" INTEGER,
ADD COLUMN     "imageLicense" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imageWidth" INTEGER,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chipset_slug_key" ON "Chipset"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Device_slug_key" ON "Device"("slug");
