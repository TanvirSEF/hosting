import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative, extname } from 'path';
import sharp from 'sharp';
import 'dotenv/config';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const PUBLIC_DIR = join(process.cwd(), 'public');
const MAPPING_FILE = join(process.cwd(), 'scripts', 'image-map.json');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function getAllFiles(dir: string, base: string = dir): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...getAllFiles(fullPath, base));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function fileExists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(localPath: string, key: string): Promise<string> {
  const ext = extname(localPath).toLowerCase();
  const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);

  let body: Buffer | Uint8Array;
  let finalKey = key;

  if (isImage) {
    const buffer = readFileSync(localPath);
    const optimized = await sharp(buffer)
      .resize(1920, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    body = optimized;
    finalKey = key.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  } else {
    body = readFileSync(localPath);
  }

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: finalKey,
    Body: body,
    ContentType: isImage ? 'image/webp' : undefined,
  }));

  return `${R2_PUBLIC_URL}/${finalKey}`;
}

async function main() {
  console.log('Scanning public/images/...');
  const imageFiles = getAllFiles(join(PUBLIC_DIR, 'images'));
  console.log(`Found ${imageFiles.length} files`);

  // Also include root-level images
  const rootFiles = readdirSync(PUBLIC_DIR)
    .filter(f => statSync(join(PUBLIC_DIR, f)).isFile() && /\.(jpg|jpeg|png)$/i.test(f))
    .map(f => join(PUBLIC_DIR, f));

  const allFiles = [...imageFiles, ...rootFiles];
  console.log(`Total files to process: ${allFiles.length}`);

  const mapping: Record<string, string> = {};
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const relativePath = relative(process.cwd(), filePath).replace(/\\/g, '/');
    const key = relativePath; // e.g., public/images/home/hero-image.png

    try {
      const ext = extname(filePath).toLowerCase();
      const isImage = ['.png', '.jpg', '.jpeg'].includes(ext);
      const checkKey = isImage ? key.replace(/\.(png|jpg|jpeg)$/i, '.webp') : key;

      if (await fileExists(checkKey)) {
        mapping[`/${relativePath.replace(/^public\//, '')}`] = `${R2_PUBLIC_URL}/${checkKey}`;
        if (isImage) {
          mapping[`/${relativePath.replace(/^public\//, '').replace(/\.(png|jpg|jpeg)$/i, '.webp')}`] = `${R2_PUBLIC_URL}/${checkKey}`;
        }
        skipped++;
        process.stdout.write(`\r[${i + 1}/${allFiles.length}] Skipped (exists): ${relativePath}          `);
        continue;
      }

      const url = await uploadFile(filePath, key);
      // Map original local path → R2 URL
      const localRef = `/${relativePath.replace(/^public\//, '')}`;
      mapping[localRef] = url;

      // If we converted to webp, also map the webp extension
      if (isImage) {
        const webpRef = localRef.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        mapping[webpRef] = url;
      }

      uploaded++;
      process.stdout.write(`\r[${i + 1}/${allFiles.length}] Uploaded: ${relativePath} → ${url.substring(url.lastIndexOf('/') + 1)}          `);
    } catch (err: any) {
      failed++;
      console.error(`\nFailed: ${relativePath} — ${err.message}`);
    }
  }

  console.log(`\n\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`Mapping saved to ${MAPPING_FILE}`);

  mkdirSync(join(process.cwd(), 'scripts'), { recursive: true });
  writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
  console.log(`Total mappings: ${Object.keys(mapping).length}`);
}

main().catch(console.error);
