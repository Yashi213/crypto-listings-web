/*
  Warnings:

  - You are about to drop the column `baseAsset` on the `TradingPair` table. All the data in the column will be lost.
  - You are about to drop the column `quoteAsset` on the `TradingPair` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[listingId,baseAssetId,quoteAssetId]` on the table `TradingPair` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `baseAssetId` to the `TradingPair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteAssetId` to the `TradingPair` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TradingPair_listingId_baseAsset_quoteAsset_key";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "assetId" TEXT;

-- AlterTable
ALTER TABLE "TradingPair" DROP COLUMN "baseAsset",
DROP COLUMN "quoteAsset",
ADD COLUMN     "baseAssetId" TEXT NOT NULL,
ADD COLUMN     "quoteAssetId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketNews" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketNews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_symbol_key" ON "Asset"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "TradingPair_listingId_baseAssetId_quoteAssetId_key" ON "TradingPair"("listingId", "baseAssetId", "quoteAssetId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingPair" ADD CONSTRAINT "TradingPair_baseAssetId_fkey" FOREIGN KEY ("baseAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingPair" ADD CONSTRAINT "TradingPair_quoteAssetId_fkey" FOREIGN KEY ("quoteAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
