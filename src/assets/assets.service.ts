import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ObjectStorageService } from '../object-storage/object-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { unlinkLocalLogo, wantsLogoRemoved } from '../uploads/logo-upload.util';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

export type AssetUpdatePayload = Omit<UpdateAssetDto, 'logoUrl'> & {
  logoUrl?: string | null;
};

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly objectStorage: ObjectStorageService,
  ) {}

  async create(dto: CreateAssetDto) {
    const symbol = dto.symbol?.trim().toUpperCase();
    const name = dto.name?.trim();
    if (!symbol || !name) {
      throw new ConflictException('Тикер и название обязательны');
    }
    try {
      return await this.prisma.asset.create({
        data: {
          symbol,
          name,
          description: dto.description?.trim() || null,
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
        throw new ConflictException('Актив с таким тикером уже есть');
      }
      throw e;
    }
  }

  findAll() {
    return this.prisma.asset.findMany({ orderBy: { symbol: 'asc' } });
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        skip,
        take: limit,
        orderBy: { symbol: 'asc' },
      }),
      this.prisma.asset.count(),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    const row = await this.prisma.asset.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Актив ${id} не найден`);
    }
    return row;
  }

  async update(id: string, dto: AssetUpdatePayload) {
    const row = await this.findOne(id);
    const data: {
      symbol?: string;
      name?: string;
      description?: string | null;
      website?: string | null;
      logoUrl?: string | null;
    } = {};
    const removeLogo = wantsLogoRemoved(dto.removeLogo);
    if (removeLogo) {
      data.logoUrl = null;
    }
    if (dto.symbol !== undefined) {
      const s = dto.symbol.trim().toUpperCase();
      if (!s) {
        throw new ConflictException('Тикер не может быть пустым');
      }
      data.symbol = s;
    }
    if (dto.name !== undefined) {
      const n = dto.name.trim();
      if (!n) {
        throw new ConflictException('Название не может быть пустым');
      }
      data.name = n;
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (dto.website !== undefined) {
      data.website = dto.website.trim() || null;
    }
    if (dto.logoUrl !== undefined && !removeLogo) {
      data.logoUrl =
        dto.logoUrl === null ? null : dto.logoUrl.trim() || null;
    }
    if (Object.keys(data).length === 0) {
      return row;
    }
    try {
      const updated = await this.prisma.asset.update({
        where: { id },
        data,
      });
      if (data.logoUrl !== undefined && data.logoUrl !== row.logoUrl) {
        await this.deleteStoredLogo(row.logoUrl);
      }
      return updated;
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Актив с таким тикером уже есть');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    try {
      await this.prisma.asset.delete({ where: { id } });
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2003'
      ) {
        throw new ConflictException(
          'Нельзя удалить: актив используется в листингах или парах',
        );
      }
      throw e;
    }
    await this.deleteStoredLogo(row.logoUrl);
  }

  private async deleteStoredLogo(url: string | null): Promise<void> {
    await unlinkLocalLogo(url);
    await this.objectStorage.deleteByUrl(url);
  }
}
