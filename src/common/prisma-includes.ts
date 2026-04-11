import { Prisma } from '@prisma/client';

/** Включения для листинга в API и админке */
export const listingWithRelationsInclude = {
  exchange: true,
  asset: true,
  pairs: { include: { baseAsset: true, quoteAsset: true } },
} satisfies Prisma.ListingInclude;
