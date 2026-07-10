import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { config } from '../config';

/** Resized outputs for a single uploaded image (public URL paths). */
export interface ProcessedImage {
  imageUrl: string; // 1200px-wide full image
  thumbnailUrl: string; // 800x600 thumbnail
}

/** Absolute directory on disk holding an auction's images. */
function auctionDir(auctionId: number): string {
  return path.resolve(config.upload.dir, 'auctions', String(auctionId));
}

/** Public URL path (as stored in the DB / served by express.static). */
function publicUrl(auctionId: number, filename: string): string {
  return `${config.upload.publicPath}/auctions/${auctionId}/${filename}`;
}

/**
 * Resizes an uploaded image buffer into a 1200px-wide full version and an
 * 800x600 thumbnail, both WebP, written under uploads/auctions/:auctionId/.
 * Returns the public URL paths to persist in auction_images.
 */
export async function processAuctionImage(
  auctionId: number,
  buffer: Buffer,
): Promise<ProcessedImage> {
  const dir = auctionDir(auctionId);
  await fs.mkdir(dir, { recursive: true });

  const uuid = randomUUID();
  const fullName = `${uuid}-full.webp`;
  const thumbName = `${uuid}-thumb.webp`;

  await sharp(buffer)
    .rotate() // respect EXIF orientation before resizing
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(dir, fullName));

  await sharp(buffer)
    .rotate()
    .resize({ width: 800, height: 600, fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(path.join(dir, thumbName));

  return {
    imageUrl: publicUrl(auctionId, fullName),
    thumbnailUrl: publicUrl(auctionId, thumbName),
  };
}

/** Best-effort removal of an image's files from disk given its public URL paths. */
export async function removeImageFiles(imageUrl: string, thumbnailUrl: string): Promise<void> {
  const root = path.resolve(config.upload.dir);
  for (const url of [imageUrl, thumbnailUrl]) {
    // Map /uploads/auctions/1/x.webp -> <UPLOAD_DIR>/auctions/1/x.webp
    const rel = url.replace(new RegExp(`^${config.upload.publicPath}/`), '');
    const abs = path.resolve(config.upload.dir, rel);
    // Guard against path traversal escaping the upload root.
    if (!abs.startsWith(root)) continue;
    await fs.rm(abs, { force: true });
  }
}
