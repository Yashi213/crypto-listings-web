export function viewAuth(auth?: string, user?: string) {
  const isAuth = auth === '1' || auth === 'true';
  return {
    isAuth,
    userName: user || 'Пользователь',
  };
}
