import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.constants';

/** Эндпоинт доступен без сессии (гость). */
export const PublicAccess = () => SetMetadata(IS_PUBLIC_KEY, true);
