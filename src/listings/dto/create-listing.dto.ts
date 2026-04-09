export class CreateListingDto {
  title!: string;
  /** UPCOMING | RECENT */
  status!: string;
  /** datetime-local */
  dateAt!: string;
  description?: string;
  exchangeId!: string;
  /** пусто — без основного актива */
  assetId?: string;
}
