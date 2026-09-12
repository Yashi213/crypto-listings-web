import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const UPLOAD_LOGOS_PREFIX = '/uploads/logos';

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

export function logosDiskDir(): string {
  return join(process.cwd(), 'public', 'uploads', 'logos');
}

export function publicLogoPath(filename: string): string {
  return `${UPLOAD_LOGOS_PREFIX}/${filename}`;
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
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = logosDiskDir();
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
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

export type LogoFormBody = {
  logoUrl?: string | null;
  removeLogo?: string | boolean;
};

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

/**
 * Итоговое значение logoUrl для update и нужно ли удалить старый локальный файл.
 */
export async function applyLogoUpdateFromForm(opts: {
  existingLogoUrl: string | null;
  file: Express.Multer.File | undefined;
  body: LogoFormBody;
}): Promise<{ logoUrl?: string | null }> {
  const { existingLogoUrl, file, body } = opts;
  const remove = wantsLogoRemoved(body.removeLogo);

  if (remove) {
    await unlinkLocalLogo(existingLogoUrl);
    return { logoUrl: null };
  }

  if (file) {
    if (isLocalUploadedLogo(existingLogoUrl)) {
      await unlinkLocalLogo(existingLogoUrl);
    }
    return { logoUrl: publicLogoPath(file.filename) };
  }

  const trimmed = body.logoUrl?.trim() ?? '';
  if (trimmed !== '') {
    if (
      isLocalUploadedLogo(existingLogoUrl) &&
      trimmed !== existingLogoUrl
    ) {
      await unlinkLocalLogo(existingLogoUrl);
    }
    return { logoUrl: trimmed };
  }

  if (isLocalUploadedLogo(existingLogoUrl)) {
    return {};
  }

  return { logoUrl: null };
}

export function logoUrlForCreate(
  file: Express.Multer.File | undefined,
  logoUrlField: string | undefined,
): string | null {
  if (file) {
    return publicLogoPath(file.filename);
  }
  const t = logoUrlField?.trim();
  return t ? t : null;
}
