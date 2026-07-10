import type { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { config } from '../config';
import { AppError } from '../utils/AppError';

/**
 * In-memory multer storage — buffers are handed to Sharp for resizing, so we
 * never persist the raw upload. Limits and MIME filtering come from config.
 */
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFilesPerAuction,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new AppError('Only JPEG, PNG, WebP, or GIF images are allowed', 400));
      return;
    }
    cb(null, true);
  },
});

/** Accept up to N image files under the `images` form field. */
const rawUpload = upload.array('images', config.upload.maxFilesPerAuction);

/**
 * Runs the multer upload and translates its errors (size/count limits, etc.)
 * into AppError so the centralized handler returns a clean 400 instead of 500.
 */
export function uploadAuctionImages(req: Request, res: Response, next: NextFunction): void {
  rawUpload(req, res, (err: unknown) => {
    if (err instanceof MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `Each image must be under ${Math.round(config.upload.maxFileSize / (1024 * 1024))}MB`
          : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
            ? `An auction may have at most ${config.upload.maxFilesPerAuction} images`
            : 'Image upload failed';
      next(new AppError(message, 400));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    next();
  });
}
