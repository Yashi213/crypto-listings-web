export class CreateMarketNewDto {
  title!: string;
  /** ISO-строка из input[type=datetime-local] */
  publishedAt!: string;
  imageUrl!: string;
  imageAlt!: string;
  summary?: string;
  sourceUrl?: string;
  sortOrder?: string;
  exchangeId!: string;
}
