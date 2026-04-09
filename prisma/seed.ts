import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ListingStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { createPgPool } from '../src/prisma/pg-pool';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = createPgPool(connectionString);
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Только биржи, для которых есть файлы в public/img/*.png */
const ALLOWED_EXCHANGE_NAMES = [
  'Binance',
  'Bybit',
  'Gate.io',
  'KuCoin',
  'MEXC',
  'OKX',
] as const;

const SEED_EXCHANGES: {
  name: (typeof ALLOWED_EXCHANGE_NAMES)[number];
  website: string;
  logoUrl: string;
}[] = [
  {
    name: 'Binance',
    website: 'https://www.binance.com',
    logoUrl: '/img/binance.png',
  },
  {
    name: 'Bybit',
    website: 'https://www.bybit.com',
    logoUrl: '/img/bybit.png',
  },
  {
    name: 'Gate.io',
    website: 'https://www.gate.io',
    logoUrl: '/img/gateio.png',
  },
  {
    name: 'KuCoin',
    website: 'https://www.kucoin.com',
    logoUrl: '/img/kucoin.png',
  },
  {
    name: 'MEXC',
    website: 'https://www.mexc.com',
    logoUrl: '/img/mexc.png',
  },
  {
    name: 'OKX',
    website: 'https://www.okx.com',
    logoUrl: '/img/okx.png',
  },
];

const SEED_ASSETS: {
  symbol: string;
  name: string;
  description?: string;
  website?: string;
}[] = [
  { symbol: 'BTC', name: 'Bitcoin', website: 'https://bitcoin.org' },
  { symbol: 'ETH', name: 'Ethereum', website: 'https://ethereum.org' },
  { symbol: 'USDT', name: 'Tether USD', website: 'https://tether.to' },
  { symbol: 'SOL', name: 'Solana', website: 'https://solana.com' },
  { symbol: 'PEPE', name: 'Pepe', description: 'Мем-токен' },
  { symbol: 'ARB', name: 'Arbitrum', website: 'https://arbitrum.io' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'BNB', name: 'BNB', website: 'https://www.bnbchain.org' },
];

async function main() {
  await prisma.marketNews.deleteMany({});
  await prisma.listing.deleteMany({});

  await prisma.exchange.deleteMany({
    where: { name: { notIn: [...ALLOWED_EXCHANGE_NAMES] } },
  });

  for (const ex of SEED_EXCHANGES) {
    await prisma.exchange.upsert({
      where: { name: ex.name },
      create: {
        name: ex.name,
        website: ex.website,
        logoUrl: ex.logoUrl,
      },
      update: {
        website: ex.website,
        logoUrl: ex.logoUrl,
      },
    });
  }

  const assetIds: Record<string, string> = {};
  for (const a of SEED_ASSETS) {
    const row = await prisma.asset.upsert({
      where: { symbol: a.symbol },
      create: {
        symbol: a.symbol,
        name: a.name,
        description: a.description ?? null,
        website: a.website ?? null,
      },
      update: {
        name: a.name,
        description: a.description ?? null,
        website: a.website ?? null,
      },
    });
    assetIds[a.symbol] = row.id;
  }

  const ex = async (name: (typeof ALLOWED_EXCHANGE_NAMES)[number]) => {
    const row = await prisma.exchange.findUnique({ where: { name } });
    if (!row) throw new Error(`Биржа не найдена: ${name}`);
    return row;
  };

  const binance = await ex('Binance');
  const bybit = await ex('Bybit');
  const gateio = await ex('Gate.io');
  const kucoin = await ex('KuCoin');
  const mexc = await ex('MEXC');
  const okx = await ex('OKX');

  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 86400000);

  type Pair = { base: string; quote: string };

  async function createListing(
    data: {
      title: string;
      status: ListingStatus;
      dateAt: Date;
      description?: string;
      exchangeId: string;
      assetSymbol?: string;
      pairs: Pair[];
    },
  ) {
    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        status: data.status,
        dateAt: data.dateAt,
        description: data.description ?? null,
        exchangeId: data.exchangeId,
        assetId: data.assetSymbol
          ? assetIds[data.assetSymbol] ?? null
          : null,
      },
    });
    for (const p of data.pairs) {
      await prisma.tradingPair.create({
        data: {
          listingId: listing.id,
          baseAssetId: assetIds[p.base],
          quoteAssetId: assetIds[p.quote],
        },
      });
    }
    return listing;
  }

  await createListing({
    title: 'Листинг пары ARB/USDT',
    status: ListingStatus.UPCOMING,
    dateAt: days(3),
    description: 'Спотовый листинг на основной площадке.',
    exchangeId: binance.id,
    assetSymbol: 'ARB',
    pairs: [{ base: 'ARB', quote: 'USDT' }],
  });

  await createListing({
    title: 'Solana (SOL) — новые торговые пары',
    status: ListingStatus.RECENT,
    dateAt: days(-5),
    description: 'Расширение котировок к USDT.',
    exchangeId: bybit.id,
    assetSymbol: 'SOL',
    pairs: [{ base: 'SOL', quote: 'USDT' }],
  });

  await createListing({
    title: 'Новая пара PEPE/USDT на Gate.io',
    status: ListingStatus.RECENT,
    dateAt: days(-2),
    description: 'Мем-актив в споте.',
    exchangeId: gateio.id,
    assetSymbol: 'PEPE',
    pairs: [{ base: 'PEPE', quote: 'USDT' }],
  });

  await createListing({
    title: 'KuCoin: листинг токена в зоне Innovation',
    status: ListingStatus.UPCOMING,
    dateAt: days(7),
    exchangeId: kucoin.id,
    pairs: [{ base: 'DOGE', quote: 'USDT' }],
  });

  await createListing({
    title: 'MEXC — спотовый листинг BNB/USDT',
    status: ListingStatus.RECENT,
    dateAt: days(-1),
    description: 'Спот, стандартные комиссии.',
    exchangeId: mexc.id,
    assetSymbol: 'BNB',
    pairs: [{ base: 'BNB', quote: 'USDT' }],
  });

  await createListing({
    title: 'OKX: ETH фьючерсы и спот ETH/USDT',
    status: ListingStatus.UPCOMING,
    dateAt: days(10),
    exchangeId: okx.id,
    assetSymbol: 'ETH',
    pairs: [{ base: 'ETH', quote: 'USDT' }],
  });

  const newsBase = [
    {
      exchangeId: binance.id,
      logo: '/img/binance.png',
      title: 'Binance: отчёт о резервах и новые пары',
      summary: 'Площадка публикует обновлённые данные по резервам.',
    },
    {
      exchangeId: bybit.id,
      logo: '/img/bybit.png',
      title: 'Bybit: конкурс трейдеров и бонусы',
      summary: 'Краткосрочные акции для спотового рынка.',
    },
    {
      exchangeId: gateio.id,
      logo: '/img/gateio.png',
      title: 'Gate.io: листинги в зоне Startup',
      summary: 'Новые проекты в раннем доступе.',
    },
    {
      exchangeId: kucoin.id,
      logo: '/img/kucoin.png',
      title: 'KuCoin: обновление интерфейса спота',
      summary: 'Улучшена работа с ордерами.',
    },
    {
      exchangeId: mexc.id,
      logo: '/img/mexc.png',
      title: 'MEXC: расширение списка альткоинов',
      summary: 'Добавлены новые USDT-пары.',
    },
    {
      exchangeId: okx.id,
      logo: '/img/okx.png',
      title: 'OKX: инструменты для деривативов',
      summary: 'Обновления в разделе фьючерсов.',
    },
  ];

  let order = 0;
  for (const n of newsBase) {
    const row = await prisma.exchange.findUnique({
      where: { id: n.exchangeId },
    });
    await prisma.marketNews.create({
      data: {
        title: n.title,
        publishedAt: days(-order),
        imageUrl: n.logo,
        imageAlt: row?.name ?? 'Биржа',
        summary: n.summary,
        sortOrder: order,
        exchangeId: n.exchangeId,
      },
    });
    order += 1;
  }

  const demoEmail = 'demo@listing-tracker.local';
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      displayName: 'Демо-пользователь',
      role: UserRole.USER,
    },
    update: {},
  });

  const fbCount = await prisma.feedback.count({
    where: { userId: demoUser.id },
  });
  if (fbCount === 0) {
    await prisma.feedback.create({
      data: {
        userId: demoUser.id,
        message:
          'Удобно смотреть даты листингов и биржи в одном месте. Спасибо за демо-данные!',
        rating: 5,
      },
    });
  }

  console.log(
    'Сид: 6 бирж из public/img, листинги, новости с логотипами, отзывы (если пусто).',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
