import type { ApiResponseOptions } from '@nestjs/swagger';

/**
 * Заголовки **ответа** для пагинированных коллекций (не параметры запроса).
 * Передавать их в запросе не нужно — сервер выставляет после выполнения.
 */
export const PAGINATED_COLLECTION_RESPONSE_HEADERS: NonNullable<
  ApiResponseOptions['headers']
> = {
  'X-Total-Count': {
    description:
      'Сколько всего записей в коллекции (на всех страницах). Возвращает сервер.',
    schema: { type: 'integer', example: 42 },
  },
  Link: {
    description:
      'Ссылки на соседние страницы в формате RFC 8288 (`rel="prev"`, `rel="next"`). Клиент может перейти по ним без ручной сборки URL. Нет заголовка, если соседней страницы нет.',
    schema: {
      type: 'string',
      example:
        '<http://localhost:3000/api/exchanges?page=2&limit=20>; rel="next"',
    },
  },
};
