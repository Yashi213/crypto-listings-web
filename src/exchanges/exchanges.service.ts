import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
