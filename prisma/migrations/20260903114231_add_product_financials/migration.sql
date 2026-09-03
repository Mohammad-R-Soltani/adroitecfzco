-- CreateTable
CREATE TABLE "ProductFinancials" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "inwardQty" INTEGER,
    "purchaseRate" DOUBLE PRECISION,
    "inwardValue" DOUBLE PRECISION,
    "outwardQty" INTEGER,
    "saleRate" DOUBLE PRECISION,
    "outwardValue" DOUBLE PRECISION,
    "grossProfit" DOUBLE PRECISION,
    "marginPercent" DOUBLE PRECISION,
    "closingQty" INTEGER,
    "sourceFile" TEXT NOT NULL,
    CONSTRAINT "ProductFinancials_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "ProductFinancials_productId_periodStart_periodEnd_key" ON "ProductFinancials"("productId", "periodStart", "periodEnd");
-- AddForeignKey
ALTER TABLE "ProductFinancials" ADD CONSTRAINT "ProductFinancials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TradedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
