import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base directory for all uploaded files (product images, payment proofs, etc).
 *
 * In production this MUST point to a directory OUTSIDE the git-tracked
 * project folder (e.g. /var/www/raybert-uploads), so that a `git pull` /
 * redeploy never touches or wipes files that customers/admins have uploaded.
 *
 * Configure it via the UPLOAD_DIR env var. Falls back to ./uploads next to
 * the project (fine for local development only).
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), 'uploads');

export const PRODUCTS_SUBDIR = 'products';
export const CATEGORIES_SUBDIR = 'categories';
export const PROOFS_SUBDIR = 'payment-proofs';

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '5', 10);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

export function ensureUploadDirs(): void {
  for (const sub of [PRODUCTS_SUBDIR, CATEGORIES_SUBDIR, PROOFS_SUBDIR]) {
    const dir = path.join(UPLOAD_DIR, sub);
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log(`📁 Upload directory ready: ${UPLOAD_DIR}`);
}

function buildStorage(subfolder: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(UPLOAD_DIR, subfolder));
    },
    filename: (_req, file, cb) => {
      // Never trust the original filename (path traversal, collisions).
      // Extension is derived from the validated MIME type whenever possible.
      const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

/**
 * Creates a ready-to-use multer instance scoped to a subfolder, restricted
 * to a whitelist of MIME types and a max file size.
 */
export function makeUploader(subfolder: string, allowedMimes: string[]) {
  return multer({
    storage: buildStorage(subfolder),
    limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowedMimes.includes(file.mimetype)) {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
        return;
      }
      cb(null, true);
    },
  });
}

export function publicUrlFor(subfolder: string, filename: string): string {
  return `/uploads/${subfolder}/${filename}`;
}