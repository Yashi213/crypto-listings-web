import { BadRequestException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';

export const UPLOAD_LOGOS_PREFIX = '/uploads/logos';

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

export function logosDiskDir(): string {
  return join(process.cwd(), 'public', 'uploads', 'logos');
}

export function isLocalUploadedLogo(url: string | null | undefined): boolean {
  return !!url?.startsWith(`${UPLOAD_LOGOS_PREFIX}/`);
}

export async function unlinkLocalLogo(
  url: string | null | undefined,
): Promise<void> {
  if (!isLocalUploadedLogo(url)) {
    return;
  }
  const name = url!.slice(UPLOAD_LOGOS_PREFIX.length + 1);
  if (!name || /[/\\]/.test(name) || name.includes('..')) {
    return;
  }
  const full = join(logosDiskDir(), name);
  try {
    await unlink(full);
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return;
    }
    throw e;
  }
}

export function logoFileMulterOptions() {
  return {
    // Файл нужен AWS SDK как Buffer; на локальный диск его не записываем.
    storage: memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new BadRequestException('Выберите файл изображения'), false);
        return;
      }
      const ext = extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        cb(
          new BadRequestException(
            'Формат файла: PNG, JPEG, GIF, WebP или SVG',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

/** Удалить логотип: JSON `true`, форма `1` / `on` / `true` */
export function wantsLogoRemoved(value: unknown): boolean {
  if (value === true) {
    return true;
  }
  if (typeof value === 'string') {
    return value === '1' || value === 'on' || value === 'true';
  }
  return false;
}
