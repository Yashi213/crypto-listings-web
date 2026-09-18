import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  private parseRating(value: string | number | undefined): number | null {
    if (value === undefined || value === '') {
      return null;
    }
    const r = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }
    return r;
  }

  async create(dto: CreateFeedbackDto, actor?: AuthUser) {
    if (!actor) {
      throw new UnauthorizedException(
        'Оставить отзыв может только зарегистрированный пользователь',
      );
    }
    const message = dto.message?.trim();
    if (!message || message.length < 10) {
      throw new BadRequestException(
        'Текст отзыва обязателен (не менее 10 символов)',
      );
    }

    const rating = this.parseRating(dto.rating);
    return this.prisma.feedback.create({
      data: { message, rating, userId: actor.id },
      include: { user: true },
    });
  }

  findRecent(take: number) {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: true },
    });
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.feedback.count(),
    ]);
    return { items, total };
  }

  findAllForAdmin() {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.feedback.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!row) {
      throw new NotFoundException(`Отзыв с id ${id} не найден`);
    }
    return row;
  }

  /**
   * Частичное обновление. rating: null или '' — убрать оценку.
   */
  async update(
    id: string,
    dto: { message?: string; rating?: string | number | null },
  ) {
    await this.findOne(id);
    const data: Prisma.FeedbackUpdateInput = {};
    if (dto.message !== undefined) {
      const message = String(dto.message).trim();
      if (message.length < 10) {
        throw new BadRequestException(
          'Текст отзыва обязателен (не менее 10 символов)',
        );
      }
      data.message = message;
    }
    if (dto.rating !== undefined) {
      if (dto.rating === null || dto.rating === '') {
        data.rating = null;
      } else {
        data.rating = this.parseRating(dto.rating);
      }
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Укажите хотя бы одно поле для обновления');
    }
    return this.prisma.feedback.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feedback.delete({
      where: { id },
      include: { user: true },
    });
  }
}
