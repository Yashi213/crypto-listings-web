/** Данные сессии в шаблоны кладёт ViewAuthInterceptor, не query ?auth=1. */
export function viewAuth(_auth?: string, _user?: string) {
  return {};
}
