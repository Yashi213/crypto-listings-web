/*
  Warnings:

  - Added the required column `exchangeId` to the `MarketNews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MarketNews" ADD COLUMN     "exchangeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "MarketNews" ADD CONSTRAINT "MarketNews_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
