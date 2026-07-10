import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

/** Resized outputs for a single uploaded image (public URL paths). */
export interface ProcessedImage {
  imageUrl: string; // 1200px-wide full image
  thumbnailUrl: string; // 800x600 thumbnail
}

// Configure the Cloudinary SDK once at module load when credentials are present.
if (config.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
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
 * 800x600 thumbnail. In production (Cloudinary configured) the original is
 * uploaded once to a persistent CDN and the two sizes are derived via URL
 * transforms; locally it falls back to Sharp writing WebP under
 * uploads/auctions/:auctionId/. Returns the URLs to persist in auction_images.
 */
export async function processAuctionImage(
  auctionId: number,
  buffer: Buffer,
): Promise<ProcessedImage> {
  if (config.cloudinary.enabled) {
    return uploadToCloudinary(auctionId, buffer);
  }
  return processWithSharp(auctionId, buffer);
}

/** Uploads the original once, then builds transform URLs for full + thumb. */
async function uploadToCloudinary(auctionId: number, buffer: Buffer): Promise<ProcessedImage> {
  const publicId = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `bidstorm/auctions/${auctionId}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve(result.public_id);
      },
    );
    stream.end(buffer);
  });

  // Full: cap width at 1200px, don't enlarge. Thumb: 800x600 fill crop.
  const imageUrl = cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  });
  const thumbnailUrl = cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: 800, height: 600, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return { imageUrl, thumbnailUrl };
}

/** Local development path: Sharp resize to WebP files on disk. */
async function processWithSharp(auctionId: number, buffer: Buffer): Promise<ProcessedImage> {
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

/**
 * Best-effort removal of an image given its stored URLs. Cloudinary-hosted
 * images (both URLs share one public_id) are destroyed via the API; local
 * files are unlinked from disk.
 */
export async function removeImageFiles(imageUrl: string, thumbnailUrl: string): Promise<void> {
  if (config.cloudinary.enabled && isCloudinaryUrl(imageUrl)) {
    const publicId = cloudinaryPublicId(imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch {
        // Best-effort: a failed CDN delete shouldn't block the DB removal.
      }
    }
    return;
  }

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

function isCloudinaryUrl(url: string): boolean {
  return /res\.cloudinary\.com/.test(url);
}

/**
 * Extracts the Cloudinary public_id from a delivery URL, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/w_1200,.../bidstorm/auctions/1/abc.jpg
 * -> bidstorm/auctions/1/abc  (drops transform segment, version, and extension).
 */
function cloudinaryPublicId(url: string): string | null {
  const match = /\/upload\/(?:.*?\/)?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/.exec(url);
  if (!match) return null;
  // If a transform segment (contains a comma or known param) slipped in as the
  // first path chunk, strip it.
  const segments = match[1].split('/');
  if (segments.length > 1 && /(^|,)(w|h|c|g|q|f)_/.test(segments[0])) {
    segments.shift();
  }
  return segments.join('/');
}
