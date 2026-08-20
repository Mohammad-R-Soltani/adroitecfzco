-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "BrandSlug" AS ENUM ('apple', 'xiaomi');

-- CreateEnum
CREATE TYPE "DeviceCategory" AS ENUM ('PHONE', 'TABLET', 'LAPTOP', 'WATCH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "slug" "BrandSlug" NOT NULL,
    "name" TEXT NOT NULL,
    "accent" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chipset" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "processNode" TEXT NOT NULL,
    "cpuSummary" TEXT NOT NULL,
    "gpuSummary" TEXT NOT NULL,
    "npuSummary" TEXT,
    "maxRam" TEXT,
    "highlight" TEXT NOT NULL,
    "gradientFrom" TEXT NOT NULL,
    "gradientTo" TEXT NOT NULL,
    "sourceNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chipset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "chipsetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DeviceCategory" NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "region" TEXT,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chipsetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Chipset_brandId_name_key" ON "Chipset"("brandId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Device_chipsetId_name_key" ON "Device"("chipsetId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_chipsetId_key" ON "Bookmark"("userId", "chipsetId");

-- AddForeignKey
ALTER TABLE "Chipset" ADD CONSTRAINT "Chipset_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_chipsetId_fkey" FOREIGN KEY ("chipsetId") REFERENCES "Chipset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_chipsetId_fkey" FOREIGN KEY ("chipsetId") REFERENCES "Chipset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
