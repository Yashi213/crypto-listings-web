import { Header } from '@nestjs/common';

/** Браузер может держать ответ час и не ходить на сервер. */
export const CACHE_CONTROL_HOUR = 'public, max-age=3600';

/** Cache-Control для GET REST. После max-age клиент переспросит и сверит ETag. */
export const CacheControl = (value = CACHE_CONTROL_HOUR) =>
  Header('Cache-Control', value);
