import type { Request, Response } from 'express';

/**
 * Заголовок Link (RFC 8288) для prev/next страниц коллекции.
 */
export function setPaginationLinkHeader(
  req: Request,
  res: Response,
  page: number,
  limit: number,
  total: number,
): void {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const parts: string[] = [];
  const pathOnly = req.originalUrl.split('?')[0];
  const host = req.get('host');
  const proto = req.protocol;

  const buildUrl = (p: number): string => {
    const params = new URLSearchParams();
    const q = req.query as Record<string, string | string[] | undefined>;
    for (const key of Object.keys(q)) {
      if (key === 'page' || key === 'limit') continue;
      const v = q[key];
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        v.forEach((item) => params.append(key, String(item)));
      } else {
        params.set(key, String(v));
      }
    }
    params.set('page', String(p));
    params.set('limit', String(limit));
    return `${proto}://${host}${pathOnly}?${params.toString()}`;
  };

  if (page > 1) {
    parts.push(`<${buildUrl(page - 1)}>; rel="prev"`);
  }
  if (page < totalPages) {
    parts.push(`<${buildUrl(page + 1)}>; rel="next"`);
  }
  if (parts.length > 0) {
    res.setHeader('Link', parts.join(', '));
  }
  res.setHeader('X-Total-Count', String(total));
}
