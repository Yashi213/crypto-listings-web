import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { listingWithRelationsInclude } from '../common/prisma-includes';
import { PrismaService } from '../prisma/prisma.service';
import { unlinkLocalLogo } from '../uploads/logo-upload.util';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';

export type ExchangeUpdatePayload = Omit<UpdateExchangeDto, 'logoUrl'> & {
  logoUrl?: string | null;
};

@Injectable()
export class ExchangesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExchangeDto) {
    const name = dto.name?.trim();
    if (!name) {
      throw new ConflictException('Название биржи обязательно');
    }
    try {
      return await this.prisma.exchange.create({
        data: {
          name,
          website: dto.website?.trim() || null,
          logoUrl: dto.logoUrl?.trim() || null,
        },
      });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Биржа с таким названием уже есть');
      }
      throw e;
    }
  }

  findAll() {
    return this.prisma.exchange.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.exchange.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.exchange.count(),
    ]);
    return { items, total };
  }

  async findListingsByExchangePaginated(
    exchangeId: string,
    page: number,
    limit: number,
  ) {
    await this.findOne(exchangeId);
    const skip = (page - 1) * limit;
    const where = { exchangeId };
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

  async findListingInExchange(exchangeId: string, listingId: string) {
    await this.findOne(exchangeId);
    const row = await this.prisma.listing.findFirst({
      where: { id: listingId, exchangeId },
      include: listingWithRelationsInclude,
    });
    if (!row) {
      throw new NotFoundException(
        `Листинг ${listingId} не найден у биржи ${exchangeId}`,
      );
    }
    return row;
  }

  async findMarketNewsByExchangePaginated(
    exchangeId: string,
    page: number,
    limit: number,
  ) {
    await this.findOne(exchangeId);
    const skip = (page - 1) * limit;
    const where = { exchangeId };
    const [items, total] = await Promise.all([
      this.prisma.marketNews.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
        include: { exchange: true },
      }),
      this.prisma.marketNews.count({ where }),
    ]);
    return { items, total };
  }

  async findMarketNewsInExchange(exchangeId: string, newsId: string) {
    await this.findOne(exchangeId);
    const row = await this.prisma.marketNews.findFirst({
      where: { id: newsId, exchangeId },
      include: { exchange: true },
    });
    if (!row) {
      throw new NotFoundException(
        `Новость ${newsId} не найдена у биржи ${exchangeId}`,
      );
    }
    return row;
  }

  async findOne(id: string) {
    const row = await this.prisma.exchange.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Биржа ${id} не найдена`);
    }
    return row;
  }

  async update(id: string, dto: ExchangeUpdatePayload) {
    await this.findOne(id);
    const data: { name?: string; website?: string | null; logoUrl?: string | null } =
      {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new ConflictException('Название биржи не может быть пустым');
      }
      data.name = name;
    }
    if (dto.website !== undefined) {
      data.website = dto.website.trim() || null;
    }
    if (dto.logoUrl !== undefined) {
      data.logoUrl =
        dto.logoUrl === null ? null : dto.logoUrl.trim() || null;
    }
    try {
      return await this.prisma.exchange.update({
        where: { id },
        data,
      });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Биржа с таким названием уже есть');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await unlinkLocalLogo(row.logoUrl);
    await this.prisma.exchange.delete({ where: { id } });
  }
}
