-- CreateEnum
CREATE TYPE "ModuleAccess" AS ENUM ('CATALOG', 'SALES');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "modules" "ModuleAccess"[] DEFAULT ARRAY['CATALOG']::"ModuleAccess"[];
