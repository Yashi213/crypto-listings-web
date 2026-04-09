import { Pool } from 'pg';

function isAivenCloudConnection(connectionString: string): boolean {
  return /aivencloud\.com/i.test(connectionString);
}

function urlHasSslMode(connectionString: string): boolean {
  return /[?&]sslmode=/i.test(connectionString);
}

function stripSslModeFromUrl(connectionString: string): string {
  try {
    const isPostgresql = /^postgresql:/i.test(connectionString);
    const u = new URL(connectionString.replace(/^postgres(ql)?:/i, 'http:'));
    u.searchParams.delete('sslmode');
    u.searchParams.delete('sslcert');
    u.searchParams.delete('sslkey');
    u.searchParams.delete('sslrootcert');
    let out = u.toString().replace(/^http:/i, isPostgresql ? 'postgresql:' : 'postgres:');
    if (out.endsWith('?')) {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    return connectionString
      .replace(/[?&]sslmode=[^&]*/gi, '')
      .replace(/\?&/g, '?')
      .replace(/\?$/, '');
  }
}

/**
 * Параметр sslmode в URI и облако (Aiven): см. PrismaService.
 * Общая логика для приложения и prisma/seed.ts.
 */
export function createPgPool(connectionString: string): Pool {
  const strict =
    process.env.DATABASE_SSL_STRICT === '1' ||
    process.env.DATABASE_SSL_STRICT === 'true';
  const envUnverify =
    process.env.DATABASE_SSL_UNVERIFY === '1' ||
    process.env.DATABASE_SSL_UNVERIFY === 'true';

  const relaxTls =
    !strict &&
    (envUnverify ||
      isAivenCloudConnection(connectionString) ||
      urlHasSslMode(connectionString));

  const conn = relaxTls
    ? stripSslModeFromUrl(connectionString)
    : connectionString;

  return new Pool({
    connectionString: conn,
    ...(relaxTls ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}
