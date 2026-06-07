import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { StorageCreateUploadUrlRequest, StorageCreateUploadUrlResponse, StorageUploadKind } from '@kodira/types';
import { Course } from '../education/schemas/course.schema';
import type { CourseDocument } from '../education/schemas/course.schema';

const MAX_BYTES: Record<StorageUploadKind, number> = {
  video: 2 * 1024 * 1024 * 1024,
  image: 5 * 1024 * 1024,
  attachment: 50 * 1024 * 1024,
};

const ALLOWED_CONTENT_TYPES: Record<StorageUploadKind, ReadonlyArray<string>> = {
  video: ['video/mp4', 'video/webm'],
  image: ['image/png', 'image/jpeg', 'image/webp'],
  attachment: ['application/pdf', 'application/zip', 'application/x-zip-compressed'],
};

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

@Injectable()
export class StorageService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(Course.name) private readonly courses: Model<CourseDocument>,
  ) {}

  async createUploadUrl(params: {
    userId: string;
    input: StorageCreateUploadUrlRequest;
  }): Promise<StorageCreateUploadUrlResponse> {
    const { input } = params;

    const course = await this.courses.findById(input.courseId);
    if (!course) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Course not found',
      });
    }

    const isOwner = this.isOwner(course.instructor, params.userId);
    if (!isOwner) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Not course owner',
      });
    }

    if (input.lessonId) {
      const lessonExists = this.courseHasLesson(course, input.lessonId);
      if (!lessonExists) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Lesson does not belong to course',
          details: {
            reason: 'INVALID_LESSON',
            lessonId: input.lessonId,
            courseId: input.courseId,
          },
        });
      }
    }

    const normalizedFilename = this.normalizeFilename(input.filename);
    if (!normalizedFilename) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'filename is required',
        details: { reason: 'INVALID_FILENAME' },
      });
    }

    const allowedContentTypes = ALLOWED_CONTENT_TYPES[input.kind] ?? [];
    const okType = allowedContentTypes.includes(input.contentType);
    if (!okType) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'contentType not allowed for kind',
        details: {
          reason: 'INVALID_CONTENT_TYPE',
          kind: input.kind,
          contentType: input.contentType,
          allowed: allowedContentTypes,
        },
      });
    }

    const maxBytes = MAX_BYTES[input.kind];
    if (typeof maxBytes === 'number' && input.sizeBytes > maxBytes) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'sizeBytes exceeds limit',
        details: {
          reason: 'FILE_TOO_LARGE',
          kind: input.kind,
          sizeBytes: input.sizeBytes,
          maxBytes,
        },
      });
    }

    const ext = this.pickExtension(input.contentType, normalizedFilename);
    const key = `courses/${input.courseId}/${input.kind}/${crypto.randomUUID()}.${ext}`;
    const uploadUrl = await this.signPutUrl({
      key,
      contentType: input.contentType,
      cacheControl: input.kind === 'video' ? 'public, max-age=31536000' : 'public, max-age=31536000, immutable',
    });

    const publicUrl = this.buildPublicUrl(key);
    return { uploadUrl, publicUrl, key };
  }

  async createPutUploadUrl(params: {
    key: string;
    contentType: string;
    cacheControl?: string;
  }): Promise<{ uploadUrl: string }> {
    const key = (params.key ?? '').trim().replace(/^\/+/, '');
    const contentType = (params.contentType ?? '').trim();
    if (!key) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'key is required',
        details: { reason: 'INVALID_KEY' },
      });
    }
    if (!contentType) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'contentType is required',
        details: { reason: 'INVALID_CONTENT_TYPE' },
      });
    }

    const uploadUrl = await this.signPutUrl({
      key,
      contentType,
      cacheControl:
        params.cacheControl ?? 'public, max-age=31536000, immutable',
    });
    return { uploadUrl };
  }

  async createGetDownloadUrl(params: {
    key: string;
    expiresInSeconds?: number;
  }): Promise<{ downloadUrl: string }> {
    const key = (params.key ?? '').trim().replace(/^\/+/, '');
    if (!key || key.includes('..')) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'key is invalid',
        details: { reason: 'INVALID_KEY' },
      });
    }

    const expiresIn =
      typeof params.expiresInSeconds === 'number' &&
      params.expiresInSeconds > 0 &&
      params.expiresInSeconds <= 3600
        ? Math.floor(params.expiresInSeconds)
        : 600;

    const bucket = (this.config.get<string>('R2_BUCKET') ?? '').trim();
    if (!bucket) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Storage is not configured',
        details: { missing: ['R2_BUCKET'] },
      });
    }

    const client = this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const downloadUrl = await getSignedUrl(client, command, { expiresIn });
    return { downloadUrl };
  }

  private normalizeFilename(filename: string): string {
    const base = path.basename(filename ?? '').trim();
    const cleaned = base.replaceAll('\u0000', '').trim();
    if (cleaned.includes('/') || cleaned.includes('\\')) return '';
    return cleaned;
  }

  private pickExtension(contentType: string, filename: string): string {
    const byType = CONTENT_TYPE_TO_EXT[contentType];
    if (byType) return byType;
    const ext = path.extname(filename).replace('.', '').toLowerCase();
    if (!ext) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'filename must include an extension',
        details: { reason: 'INVALID_FILENAME' },
      });
    }
    return ext;
  }

  private buildPublicUrl(key: string): string {
    const base = (this.config.get<string>('R2_PUBLIC_URL') ?? '').trim().replace(/\/+$/, '');
    if (!base) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Storage is not configured',
        details: { missing: ['R2_PUBLIC_URL'] },
      });
    }
    return `${base}/${key}`;
  }

  private getS3Client(): S3Client {
    const accountId = (this.config.get<string>('R2_ACCOUNT_ID') ?? '').trim();
    const endpointRaw = (this.config.get<string>('R2_ENDPOINT') ?? '').trim();
    const endpoint =
      endpointRaw.length > 0
        ? endpointRaw
        : accountId.length > 0
          ? `https://${accountId}.r2.cloudflarestorage.com`
          : '';
    const accessKeyId = (this.config.get<string>('R2_ACCESS_KEY_ID') ?? '').trim();
    const secretAccessKey = (this.config.get<string>('R2_SECRET_ACCESS_KEY') ?? '').trim();

    const missing: string[] = [];
    if (!accountId) missing.push('R2_ACCOUNT_ID');
    if (!endpoint) missing.push('R2_ENDPOINT');
    if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');

    if (missing.length > 0) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Storage is not configured',
        details: {
          missing,
          hasEndpointRaw: Boolean(endpointRaw),
        },
      });
    }

    return new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  private async signPutUrl(params: {
    key: string;
    contentType: string;
    cacheControl: string;
  }): Promise<string> {
    const bucket = (this.config.get<string>('R2_BUCKET') ?? '').trim();
    if (!bucket) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Storage is not configured',
        details: { missing: ['R2_BUCKET'] },
      });
    }

    const client = this.getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      ContentType: params.contentType,
      CacheControl: params.cacheControl,
    });
    return getSignedUrl(client, command, { expiresIn: 600 });
  }

  private isOwner(courseInstructor: unknown, userId: string) {
    if (!courseInstructor) return false;
    const equals = (courseInstructor as any)?.equals as ((other: any) => boolean) | undefined;
    if (typeof equals === 'function') {
      try {
        return equals.call(courseInstructor, new Types.ObjectId(userId));
      } catch {
        return false;
      }
    }
    const value =
      typeof courseInstructor === 'string'
        ? courseInstructor
        : (courseInstructor as any)?.toString?.();
    return typeof value === 'string' && value === userId;
  }

  private courseHasLesson(course: CourseDocument, lessonId: string): boolean {
    let target: Types.ObjectId;
    try {
      target = new Types.ObjectId(lessonId);
    } catch {
      return false;
    }

    for (const section of course.sections ?? []) {
      const lessons = (section as any)?.lessons ?? [];
      for (const lesson of lessons) {
        const id = (lesson as any)?._id;
        const equals = id?.equals as ((other: any) => boolean) | undefined;
        if (typeof equals === 'function') {
          if (equals.call(id, target)) return true;
        } else if (typeof id?.toString === 'function' && id.toString() === lessonId) {
          return true;
        }
      }
    }
    return false;
  }
}

