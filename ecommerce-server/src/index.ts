import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB, sequelize } from './config/database.js';
import { Category, Product, User, Order, OrderItem, Promotion, Review, AuditLog, StoreSettings } from './models/index.js';
import { seedDatabase } from './seeders/seed.js';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4242;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

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

async function startServer() {
  console.log(`🛒  Backend running on http://localhost:${PORT}`);

  try {
    await connectDB();
    console.log('✅ Database connection established');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronized');

    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      console.log('🌱 Seeding initial data...');
      await seedDatabase();
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.log('⚠️  Server started but database is not connected');
  }
}

app.listen(PORT, () => startServer());
