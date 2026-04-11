import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

const GUEST_EMAIL = 'guest@listing-tracker.local';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureGuestUser() {
    let u = await this.prisma.user.findUnique({
      where: { email: GUEST_EMAIL },
    });
    if (!u) {
      u = await this.prisma.user.create({
        data: {
          email: GUEST_EMAIL,
          displayName: 'Гость (форма на сайте)',
          role: 'USER',
        },
      });
    }
    return u;
  }

  private parseRating(value: string | number | undefined): number | null {
    if (value === undefined || value === '') {
      return null;
    }
    const r =
      typeof value === 'number' ? value : parseInt(String(value), 10);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }
    return r;
  }

  private static readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async create(dto: CreateFeedbackDto) {
    const message = dto.message?.trim();
    if (!message || message.length < 10) {
      throw new BadRequestException(
        'Текст отзыва обязателен (не менее 10 символов)',
      );
    }
    const displayName = dto.displayName?.trim();
    const emailRaw = dto.email?.trim();
    const email = emailRaw ? emailRaw.toLowerCase() : undefined;

    let userId: string;
    if (displayName && email) {
      if (displayName.length < 3) {
        throw new BadRequestException('ФИО: минимум 3 символа');
      }
      if (!FeedbackService.emailRegex.test(email)) {
        throw new BadRequestException('Введите корректный email');
      }
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        userId = existing.id;
      } else {
        const u = await this.prisma.user.create({
          data: { email, displayName, role: 'USER' },
        });
        userId = u.id;
      }
    } else if (!displayName && !email) {
      const g = await this.ensureGuestUser();
      userId = g.id;
    } else {
      throw new BadRequestException('Укажите и ФИО, и email');
    }

    const rating = this.parseRating(dto.rating);
    return this.prisma.feedback.create({
      data: { message, rating, userId },
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
}
