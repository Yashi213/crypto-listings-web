export class AuthModuleOptions {
  connectionUri!: string;
  apiKey?: string;
  appName!: string;
  apiDomain!: string;
  websiteDomain!: string;
  apiBasePath!: string;
  websiteBasePath!: string;
  /** Email через запятую: этим пользователям выдаётся роль ADMIN */
  adminEmails!: string[];
}

export function authOptionsFromEnv(): AuthModuleOptions {
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const origin = (
    process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`
  ).replace(/\/$/, '');
  const adminRaw = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(',');
  return {
    connectionUri:
      process.env.SUPERTOKENS_CONNECTION_URI?.trim() ||
      'https://try.supertokens.com',
    apiKey: process.env.SUPERTOKENS_API_KEY?.trim() || undefined,
    appName: process.env.SUPERTOKENS_APP_NAME?.trim() || 'Listing Tracker',
    apiDomain: process.env.SUPERTOKENS_API_DOMAIN?.trim() || origin,
    websiteDomain: process.env.SUPERTOKENS_WEBSITE_DOMAIN?.trim() || origin,
    apiBasePath: process.env.SUPERTOKENS_API_BASE_PATH?.trim() || '/auth',
    websiteBasePath:
      process.env.SUPERTOKENS_WEBSITE_BASE_PATH?.trim() || '/login',
    adminEmails: adminRaw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  };
}
