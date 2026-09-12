import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { listingWithRelationsInclude } from '../common/prisma-includes';
import { AddTradingPairDto } from './dto/add-trading-pair.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

const FAQ_ITEMS = [
  {
    question: 'Как часто обновляется информация о листингах?',
    answer:
      'Данные берутся из базы; при изменениях через админку страница отражает актуальное состояние.',
  },
  {
    question: 'Насколько точны даты листингов?',
    answer:
      'Даты указываются при вводе листинга; при необходимости их можно изменить в справочнике.',
  },
  {
    question: 'Как получать уведомления о новых листингах?',
    answer: 'Soon',
  },
];

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatRuDate(d: Date): string {
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private parseStatus(value: string | ListingStatus): ListingStatus {
    const v = String(value ?? '')
      .trim()
      .toUpperCase();
    if (v === ListingStatus.UPCOMING || v === ListingStatus.RECENT) {
      return v;
    }
    throw new BadRequestException('Статус должен быть UPCOMING или RECENT');
  }

  private parseDateAt(value: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Некорректная дата листинга');
    }
    return d;
  }

  private mapListingCard(
    listing: {
      title: string;
      dateAt: Date;
      description: string | null;
      exchange: { name: string };
      pairs: { baseAsset: { symbol: string }; quoteAsset: { symbol: string } }[];
    },
    status: ListingStatus,
  ) {
    const pairsStr =
      listing.pairs.length > 0
        ? listing.pairs
            .map((p) => `${p.baseAsset.symbol}/${p.quoteAsset.symbol}`)
            .join(', ')
        : undefined;
    const base: Record<string, unknown> = {
      title: listing.title,
      exchange: listing.exchange.name,
      dateLabel: status === ListingStatus.UPCOMING ? 'Дата' : 'Дата листинга',
      dateText: this.formatRuDate(listing.dateAt),
    };
    if (status === ListingStatus.UPCOMING) {
      base.datetime = listing.dateAt.toISOString().slice(0, 16);
    }
    if (pairsStr) {
      base.pairs = pairsStr;
    }
    if (listing.description) {
      base.features = listing.description;
    }
    return base;
  }

  async getListingPagePayload() {
    const [exchanges, upcomingRaw, recentRaw, newsRows, counts] =
      await Promise.all([
        this.prisma.exchange.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.listing.findMany({
          where: { status: ListingStatus.UPCOMING },
          orderBy: { dateAt: 'asc' },
          include: {
            exchange: true,
            pairs: { include: { baseAsset: true, quoteAsset: true } },
          },
        }),
        this.prisma.listing.findMany({
          where: { status: ListingStatus.RECENT },
          orderBy: { dateAt: 'desc' },
          include: {
            exchange: true,
            pairs: { include: { baseAsset: true, quoteAsset: true } },
          },
        }),
        this.prisma.marketNews.findMany({
          orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
          include: { exchange: true },
          take: 24,
        }),
        this.prisma.listing.groupBy({
          by: ['exchangeId'],
          _count: { id: true },
        }),
      ]);

    const exchangeById = Object.fromEntries(exchanges.map((e) => [e.id, e]));

    const newsCards = newsRows.map((n) => ({
      imgSrc: n.imageUrl,
      imgAlt: n.imageAlt,
      title: n.title,
      date: this.formatRuDate(n.publishedAt),
    }));

    const upcomingListings = upcomingRaw.map((l) =>
      this.mapListingCard(l, ListingStatus.UPCOMING),
    );
    const recentListings = recentRaw.map((l) =>
      this.mapListingCard(l, ListingStatus.RECENT),
    );

    const statsRows = counts.map((c) => ({
      exchange: exchangeById[c.exchangeId]?.name ?? c.exchangeId,
      count: String(c._count.id),
      avg: '—',
      best: '—',
      worst: '—',
    }));

    const exchangeLogos = exchanges.map((e) => ({
      src: e.logoUrl && e.logoUrl.length > 0 ? e.logoUrl : '/img/logo.svg',
      alt: e.name,
    }));

    const exchangesList = exchanges.map((e) => ({ id: e.id, name: e.name }));

    return {
      newsCards,
      upcomingListings,
      recentListings,
      statsRows,
      exchangeLogos,
      exchangesList,
      faq: FAQ_ITEMS,
    };
  }

  async getFormOptions() {
    const [exchanges, assets] = await Promise.all([
      this.prisma.exchange.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.asset.findMany({ orderBy: { symbol: 'asc' } }),
    ]);
    return { exchanges, assets };
  }

  async create(dto: CreateListingDto) {
    const title = dto.title?.trim();
    if (!title) {
      throw new BadRequestException('Название листинга обязательно');
    }
    const ex = await this.prisma.exchange.findUnique({
      where: { id: dto.exchangeId },
    });
    if (!ex) {
      throw new NotFoundException('Биржа не найдена');
    }
    const assetId = dto.assetId?.trim() || null;
    if (assetId) {
      const a = await this.prisma.asset.findUnique({ where: { id: assetId } });
      if (!a) {
        throw new NotFoundException('Актив не найден');
      }
    }
    return this.prisma.listing.create({
      data: {
        title,
        status: this.parseStatus(dto.status),
        dateAt: this.parseDateAt(dto.dateAt),
        description: dto.description?.trim() || null,
        exchangeId: dto.exchangeId,
        assetId,
      },
      include: listingWithRelationsInclude,
    });
  }

  findAllForAdmin() {
    return this.prisma.listing.findMany({
      orderBy: [{ dateAt: 'desc' }],
      include: listingWithRelationsInclude,
    });
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        skip,
        take: limit,
        orderBy: [{ dateAt: 'desc' }],
        include: listingWithRelationsInclude,
      }),
      this.prisma.listing.count(),
    ]);
    return { items, total };
  }

  async findAllByAssetPaginated(assetId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { assetId };
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateAt: 'desc' },
        include: listingWithRelationsInclude,
      }),
      this.prisma.listing.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      include: listingWithRelationsInclude,
    });
    if (!row) {
      throw new NotFoundException(`Листинг ${id} не найден`);
    }
    return row;
  }

  async update(id: string, dto: UpdateListingDto) {
    await this.findOne(id);
    const data: Prisma.ListingUpdateInput = {};
    if (dto.title !== undefined) {
      const t = dto.title.trim();
      if (!t) {
        throw new BadRequestException('Название не может быть пустым');
      }
      data.title = t;
    }
    if (dto.status !== undefined) {
      data.status = this.parseStatus(dto.status);
    }
    if (dto.dateAt !== undefined) {
      data.dateAt = this.parseDateAt(dto.dateAt);
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (dto.exchangeId !== undefined) {
      const ex = await this.prisma.exchange.findUnique({
        where: { id: dto.exchangeId },
      });
      if (!ex) {
        throw new NotFoundException('Биржа не найдена');
      }
      data.exchange = { connect: { id: dto.exchangeId } };
    }
    if (dto.assetId !== undefined) {
      const raw = dto.assetId.trim();
      if (!raw) {
        data.asset = { disconnect: true };
      } else {
        const a = await this.prisma.asset.findUnique({ where: { id: raw } });
        if (!a) {
          throw new NotFoundException('Актив не найден');
        }
        data.asset = { connect: { id: raw } };
      }
    }
    return this.prisma.listing.update({
      where: { id },
      data,
      include: listingWithRelationsInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.listing.delete({ where: { id } });
  }

  async addTradingPair(listingId: string, dto: AddTradingPairDto) {
    await this.findOne(listingId);
    const baseId = dto.baseAssetId?.trim();
    const quoteId = dto.quoteAssetId?.trim();
    if (!baseId || !quoteId) {
      throw new BadRequestException('Выберите базовый и котируемый актив');
    }
    if (baseId === quoteId) {
      throw new BadRequestException('База и котировка должны различаться');
    }
    const [b, q] = await Promise.all([
      this.prisma.asset.findUnique({ where: { id: baseId } }),
      this.prisma.asset.findUnique({ where: { id: quoteId } }),
    ]);
    if (!b || !q) {
      throw new NotFoundException('Один из активов не найден');
    }
    try {
      return await this.prisma.tradingPair.create({
        data: {
          listingId,
          baseAssetId: baseId,
          quoteAssetId: quoteId,
        },
        include: { baseAsset: true, quoteAsset: true },
      });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Такая пара уже добавлена к листингу');
      }
      throw e;
    }
  }

  async removeTradingPair(listingId: string, pairId: string) {
    await this.findOne(listingId);
    const pair = await this.prisma.tradingPair.findFirst({
      where: { id: pairId, listingId },
    });
    if (!pair) {
      throw new NotFoundException('Пара не найдена у этого листинга');
    }
    await this.prisma.tradingPair.delete({ where: { id: pairId } });
  }

  async findPairsPaginated(listingId: string, page: number, limit: number) {
    await this.findOne(listingId);
    const skip = (page - 1) * limit;
    const where = { listingId };
    const pairInclude = { baseAsset: true, quoteAsset: true } as const;
    const [items, total] = await Promise.all([
      this.prisma.tradingPair.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: pairInclude,
      }),
      this.prisma.tradingPair.count({ where }),
    ]);
    return { items, total };
  }

  async findPairForListing(listingId: string, pairId: string) {
    await this.findOne(listingId);
    const row = await this.prisma.tradingPair.findFirst({
      where: { id: pairId, listingId },
      include: { baseAsset: true, quoteAsset: true },
    });
    if (!row) {
      throw new NotFoundException('Пара не найдена у этого листинга');
    }
    return row;
  }
}
