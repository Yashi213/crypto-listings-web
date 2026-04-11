import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, message: body, path: req.url }
          : { ...(body as object), path: req.url },
      );
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrismaError(exception);
      res.status(mapped.status).json({
        statusCode: mapped.status,
        message: mapped.message,
        code: exception.code,
        path: req.url,
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Некорректный запрос к базе данных',
        path: req.url,
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
      path: req.url,
    });
  }

  private mapPrismaError(
    err: Prisma.PrismaClientKnownRequestError,
  ): { status: number; message: string } {
    switch (err.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Запись с такими уникальными полями уже существует',
        };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Запись не найдена' };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Нарушение ссылки на связанную запись',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Недопустимое изменение связи между записями',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Ошибка при обращении к базе данных',
        };
    }
  }
}
