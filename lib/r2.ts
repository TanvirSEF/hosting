import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME ||
  !R2_PUBLIC_URL
) {
  throw new Error('Missing R2 environment variables');
}

// S3 Client for R2 (R2 is S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  url: string;
  key: string;
  width?: number;
  height?: number;
}

/**
 * Upload image to R2 bucket
 * @param file - File buffer or File object
 * @param folder - Folder path in bucket (e.g., 'blog/featured')
 * @param optimize - Whether to optimize the image
 * @returns Upload result with public URL
 */
export async function uploadToR2(
  file: Buffer | File,
  folder: string = 'blog',
  optimize: boolean = true
): Promise<UploadResult> {
  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Optimize image if requested
    let processedBuffer = buffer;
    let metadata: { width?: number; height?: number } = {};

    if (optimize) {
      const sharpInstance = sharp(buffer);
      const imageMetadata = await sharpInstance.metadata();

      // Resize if too large (max 1920px width)
      if (imageMetadata.width && imageMetadata.width > 1920) {
        sharpInstance.resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Convert to WebP for better compression
      processedBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer();

      const finalMetadata = await sharp(processedBuffer).metadata();
      metadata.width = finalMetadata.width;
      metadata.height = finalMetadata.height;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = optimize ? 'webp' : 'jpg';
    const key = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ContentType: optimize ? 'image/webp' : 'image/jpeg',
    });

    await r2Client.send(command);

    // Return public URL using the R2_PUBLIC_URL
    const url = `${R2_PUBLIC_URL}/${key}`;

    return {
      url,
      key,
      ...metadata,
    };
  } catch (error) {
    throw new Error('Failed to upload image to R2');
  }
}

/**
 * Delete image from R2 bucket
 * @param key - Object key in bucket
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    throw new Error('Failed to delete image from R2');
  }
}

/**
 * Check if object exists in R2
 * @param key - Object key in bucket
 */
export async function checkR2ObjectExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract R2 key from public URL
 * @param url - Public URL
 */
export function extractR2Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}
