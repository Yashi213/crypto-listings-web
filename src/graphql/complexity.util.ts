/** Сложность списка: базовая цена + цена детей × размер страницы. */
export function paginatedComplexity(options: {
  args: { limit?: number };
  childComplexity: number;
}): number {
  const raw = Number(options.args?.limit ?? 20);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 100) : 20;
  return 2 + limit * Math.max(options.childComplexity, 1);
}

export const MAX_QUERY_COMPLEXITY = 250;
