import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const DEFAULT_ENDPOINT = 'https://storage.yandexcloud.net';
const DEFAULT_REGION = 'ru-central1';

@Injectable()
export class ObjectStorageService {
  private readonly bucket = process.env.S3_BUCKET?.trim() ?? '';
  private readonly endpoint =
    process.env.S3_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
  private readonly publicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL?.trim() ||
    `${this.endpoint.replace(/\/$/, '')}/${this.bucket}`;
  private readonly client: S3Client | null;

  constructor() {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();

    this.client =
      this.bucket && accessKeyId && secretAccessKey
        ? new S3Client({
            endpoint: this.endpoint,
            region: process.env.S3_REGION?.trim() || DEFAULT_REGION,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  async uploadImage(
    file: Express.Multer.File,
    owner: 'assets' | 'exchanges',
  ): Promise<string> {
    const client = this.configuredClient();
    const extension = extname(file.originalname).toLowerCase();
    const key = `logos/${owner}/${randomUUID()}${extension}`;

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  async deleteByUrl(url: string | null | undefined): Promise<void> {
    const key = this.keyFromManagedUrl(url);
    if (!key) {
      return;
    }

    await this.configuredClient().send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private configuredClient(): S3Client {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Object Storage не настроен: задайте S3_BUCKET, S3_ACCESS_KEY_ID и S3_SECRET_ACCESS_KEY',
      );
    }
    return this.client;
  }

  private keyFromManagedUrl(
    value: string | null | undefined,
  ): string | null {
    if (!value || !this.bucket) {
      return null;
    }
    const prefix = `${this.publicBaseUrl.replace(/\/$/, '')}/`;
    if (!value.startsWith(prefix)) {
      return null;
    }
    const key = value.slice(prefix.length);
    return key && !key.includes('..') ? key : null;
  }
}
