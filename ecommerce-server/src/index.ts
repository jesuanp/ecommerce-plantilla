import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/database.js';
import { Category, Product, User, Order, OrderItem, Promotion, Review, AuditLog, StoreSettings } from './models/index.js';
import { seedDatabase } from './seeders/seed.js';
import { ensureUploadDirs, UPLOAD_DIR } from './lib/uploads.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import checkoutRoutes from './routes/checkout.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import promotionsRoutes from './routes/promotions.js';
import reviewsRoutes from './routes/reviews.js';
import settingsRoutes from './routes/settings.js';
import publicSettingsRoutes from './routes/publicSettings.js';

dotenv.config();
ensureUploadDirs();

const app = express();
const PORT = process.env.PORT || 4242;

// CORS_ORIGINS accepts a comma-separated list for production, e.g.:
// CORS_ORIGINS=https://tienda.raybert.com,https://admin.raybert.com
const explicitOrigins = (process.env.CORS_ORIGINS || 'http://172.23.109.140:5173/')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Same-origin requests, curl, server-to-server calls, etc. have no
    // Origin header at all — always allow those through.
    if (!origin) return callback(null, true);

    if (explicitOrigins.includes(origin)) return callback(null, true);

    // Outside production, accept any origin. Dev setups shift constantly —
    // localhost, a LAN IP from a phone, an ngrok tunnel, a Codespaces URL —
    // and whitelisting each one by hand doesn't scale. This only relaxes
    // CORS, which just controls whether a *browser* can read the response;
    // it isn't a substitute for real auth (already required separately).
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Serves uploaded files (product images, payment proofs) directly from disk.
// In production, prefer letting Nginx serve this path directly (see deploy
// notes) — this Express static handler is a safe fallback either way.
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', checkoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/promotions', promotionsRoutes);
app.use('/api/admin/reviews', reviewsRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/settings/public', publicSettingsRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/db-status', async (_req: Request, res: Response) => {
  try {
    const { sequelize } = await import('./config/database.js');
    await sequelize.authenticate();
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, database: 'disconnected', error: String(error) });
  }
});

app.post('/api/seed', async (_req: Request, res: Response) => {
  try {
    await sequelize.sync({ force: true });
    await seedDatabase();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Catches file-upload validation errors (wrong type, too large) thrown by
// multer middleware and returns clean JSON instead of an HTML 500 page.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.name === 'MulterError' || /^Unsupported file type/.test(err?.message || '')) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  console.log(`🛒  Backend running on http://localhost:${PORT}`);

  try {
    await connectDB();
    console.log('✅ Database connection established');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronized');

    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      console.log('ℹ️  No categories found — database is empty. Run "npm run db:seed" ' +
        'to load the sample catalog, or add categories/products manually from /admin.');
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.log('⚠️  Server started but database is not connected');
  }
}

app.listen(PORT, () => startServer());