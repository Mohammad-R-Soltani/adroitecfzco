-- CreateTable
CREATE TABLE "TradedProduct" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "brandSlug" "BrandSlug" NOT NULL,
    "variant" TEXT,
    "colour" TEXT,
    "deviceId" TEXT,
    CONSTRAINT "TradedProduct_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DemandMonth" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "inwardQty" INTEGER,
    "inwardValue" DOUBLE PRECISION,
    "outwardQty" INTEGER NOT NULL,
    "outwardValue" DOUBLE PRECISION,
    "partialPeriod" BOOLEAN NOT NULL DEFAULT false,
    "sourceFile" TEXT NOT NULL,
    CONSTRAINT "DemandMonth_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DemandDay" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "inwardQty" INTEGER,
    "inwardValue" DOUBLE PRECISION,
    "outwardQty" INTEGER NOT NULL,
    "outwardValue" DOUBLE PRECISION,
    "sourceFile" TEXT NOT NULL,
    CONSTRAINT "DemandDay_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DemandForecast" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "forecastQty" INTEGER NOT NULL,
    "lowerBound" INTEGER,
    "upperBound" INTEGER,
    "confidence" DOUBLE PRECISION,
    "method" TEXT NOT NULL,
    "backtestWape" DOUBLE PRECISION,
    "sourceFile" TEXT NOT NULL,
    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "TradedProduct_sku_key" ON "TradedProduct"("sku");
-- CreateIndex
CREATE INDEX "TradedProduct_family_idx" ON "TradedProduct"("family");
-- CreateIndex
CREATE INDEX "TradedProduct_deviceId_idx" ON "TradedProduct"("deviceId");
-- CreateIndex
CREATE INDEX "DemandMonth_month_idx" ON "DemandMonth"("month");
-- CreateIndex
CREATE UNIQUE INDEX "DemandMonth_productId_month_key" ON "DemandMonth"("productId", "month");
-- CreateIndex
CREATE INDEX "DemandDay_date_idx" ON "DemandDay"("date");
-- CreateIndex
CREATE UNIQUE INDEX "DemandDay_productId_date_key" ON "DemandDay"("productId", "date");
-- CreateIndex
CREATE UNIQUE INDEX "DemandForecast_productId_periodStart_periodEnd_key" ON "DemandForecast"("productId", "periodStart", "periodEnd");
-- AddForeignKey
ALTER TABLE "TradedProduct" ADD CONSTRAINT "TradedProduct_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DemandMonth" ADD CONSTRAINT "DemandMonth_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TradedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DemandDay" ADD CONSTRAINT "DemandDay_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TradedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DemandForecast" ADD CONSTRAINT "DemandForecast_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TradedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
