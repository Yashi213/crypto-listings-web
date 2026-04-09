import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketNewDto } from './dto/create-market-new.dto';
import { UpdateMarketNewDto } from './dto/update-market-new.dto';

@Injectable()
export class MarketNewsService {
  constructor(private readonly prisma: PrismaService) {}

  private parsePublishedAt(value: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Некорректная дата публикации');
    }
    return d;
  }

  private parseSortOrder(value: string | undefined): number {
    if (value === undefined || value === '') {
      return 0;
    }
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) {
      throw new BadRequestException('Некорректный порядок сортировки');
    }
    return n;
  }

  async create(dto: CreateMarketNewDto) {
    const title = dto.title?.trim();
    if (!title) {
      throw new BadRequestException('Заголовок обязателен');
    }
    const ex = await this.prisma.exchange.findUnique({
      where: { id: dto.exchangeId },
    });
    if (!ex) {
      throw new NotFoundException('Биржа не найдена');
    }
    return this.prisma.marketNews.create({
      data: {
        title,
        publishedAt: this.parsePublishedAt(dto.publishedAt),
        imageUrl: dto.imageUrl.trim(),
        imageAlt: dto.imageAlt.trim(),
        summary: dto.summary?.trim() || null,
        sourceUrl: dto.sourceUrl?.trim() || null,
        sortOrder: this.parseSortOrder(dto.sortOrder),
        exchangeId: dto.exchangeId,
      },
      include: { exchange: true },
    });
  }

  findAll() {
    return this.prisma.marketNews.findMany({
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
      include: { exchange: true },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.marketNews.findUnique({
      where: { id },
      include: { exchange: true },
    });
    if (!row) {
      throw new NotFoundException(`Новость ${id} не найдена`);
    }
    return row;
  }

  async update(id: string, dto: UpdateMarketNewDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) {
      const t = dto.title.trim();
      if (!t) {
        throw new BadRequestException('Заголовок не может быть пустым');
      }
      data.title = t;
    }
    if (dto.publishedAt !== undefined) {
      data.publishedAt = this.parsePublishedAt(dto.publishedAt);
    }
    if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl.trim();
    }
    if (dto.imageAlt !== undefined) {
      data.imageAlt = dto.imageAlt.trim();
    }
    if (dto.summary !== undefined) {
      data.summary = dto.summary.trim() || null;
    }
    if (dto.sourceUrl !== undefined) {
      data.sourceUrl = dto.sourceUrl.trim() || null;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = this.parseSortOrder(dto.sortOrder);
    }
    if (dto.exchangeId !== undefined) {
      const ex = await this.prisma.exchange.findUnique({
        where: { id: dto.exchangeId },
      });
      if (!ex) {
        throw new NotFoundException('Биржа не найдена');
      }
      data.exchangeId = dto.exchangeId;
    }
    return this.prisma.marketNews.update({
      where: { id },
      data,
      include: { exchange: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.marketNews.delete({ where: { id } });
  }
}
