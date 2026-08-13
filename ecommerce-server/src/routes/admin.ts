import { Router, Request, Response } from 'express';
import { fn, col, literal, Op } from 'sequelize';
import { User, Product, Category, Order, OrderItem, AuditLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../lib/audit.js';
import { makeUploader, PRODUCTS_SUBDIR, CATEGORIES_SUBDIR, publicUrlFor } from '../lib/uploads.js';

const router = Router();

const productImageUploader = makeUploader(PRODUCTS_SUBDIR, [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const categoryImageUploader = makeUploader(CATEGORIES_SUBDIR, [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// The i18n editing UI (ProductForm, Categories admin page) only fills in
// `translations.es` / `translations.en` — it never sends a top-level
// `name`/`description`/etc. But those top-level columns are what's used
// for sorting, search, and the `allowNull: false` constraint on `name`.
// This fills them in from the translations (Spanish preferred, since it's
// this store's primary language) whenever the caller didn't set them
// explicitly, so creating/editing through the translated form doesn't hit
// a "cannot be null" validation error.
function deriveFromTranslations(
  payload: Record<string, any>,
  translations: { es?: Record<string, any>; en?: Record<string, any> } | undefined,
  fields: string[]
): void {
  if (!translations) return;
  for (const field of fields) {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') continue;
    const value = translations.es?.[field] || translations.en?.[field];
    if (value !== undefined && value !== null && value !== '') {
      payload[field] = value;
    }
  }
}

router.use(authenticateToken, requireAdmin);

router.use(async (req: AuthRequest, res: Response, next) => {
  if (req.user && (req.user as any).isActive === false) {
    res.status(403).json({ error: 'Account disabled' });
    return;
  }
  next();
});

router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Order, as: 'orders', separate: true, order: [['createdAt', 'DESC']] },
      ],
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const lifetimeValue = (user as any).orders?.reduce(
      (sum: number, o: any) => sum + parseFloat(o.total),
      0
    ) || 0;
    res.json({ user, lifetimeValue });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const before = { role: user.role, isActive: user.isActive };
    const { role, isActive } = req.body;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    await logAudit(req, 'user.update', 'user', user.id, { before, after: { role, isActive } });
    const safe = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    res.json(safe);
  } catch (error) {
    console.error('Admin user update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, q, from, to } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { customerEmail: { [Op.iLike]: `%${q}%` } },
        { id: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as any)[Op.gte] = new Date(from as string);
      if (to) (where.createdAt as any)[Op.lte] = new Date(to as string);
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
    });

    res.json(orders);
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/orders/export.csv', async (_req: Request, res: Response) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
    const header = 'id,createdAt,customerEmail,status,subtotal,shipping,tax,total,trackingNumber,items';
    const rows = orders.map((o: any) => {
      const items = (o.items || []).map((i: any) => `${i.name}x${i.quantity}`).join('; ');
      return [
        o.id,
        o.createdAt.toISOString(),
        o.customerEmail,
        o.status,
        o.subtotal,
        o.shipping,
        o.tax,
        o.total,
        o.trackingNumber || '',
        `"${items.replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export orders' });
  }
});

router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error('Admin order detail error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/orders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const { status, trackingNumber, notes } = req.body;
    const oldStatus = order.status;
    if (status !== undefined && status !== oldStatus) {
      const history = Array.isArray((order as any).statusHistory) ? [...(order as any).statusHistory] : [];
      history.push({ status, at: new Date().toISOString(), by: req.user?.email });
      (order as any).statusHistory = history;
      order.status = status;
    }
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (notes !== undefined) order.notes = notes;
    await order.save();
    await logAudit(req, 'order.update', 'order', order.id, { status, trackingNumber, oldStatus });
    res.json(order);
  } catch (error) {
    console.error('Admin update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Uploads a single product image to local disk (VPS-persisted directory,
// see UPLOAD_DIR) and returns its public URL to be added to Product.images.
router.post(
  '/uploads/product-image',
  productImageUploader.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'An image file is required' });
        return;
      }
      const url = publicUrlFor(PRODUCTS_SUBDIR, req.file.filename);
      await logAudit(req, 'upload.product-image', 'upload', undefined, { filename: req.file.filename });
      res.status(201).json({ url });
    } catch (error) {
      console.error('Product image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

router.post(
  '/uploads/category-image',
  categoryImageUploader.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'An image file is required' });
        return;
      }
      const url = publicUrlFor(CATEGORIES_SUBDIR, req.file.filename);
      await logAudit(req, 'upload.category-image', 'upload', undefined, { filename: req.file.filename });
      res.status(201).json({ url });
    } catch (error) {
      console.error('Category image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

router.post('/products', async (req: AuthRequest, res: Response) => {
  try {
    const { translations, ...rest } = req.body;
    const payload: any = { ...rest };
    if (translations) payload.translations = translations;
    deriveFromTranslations(payload, translations, ['name', 'description', 'longDescription', 'brand']);
    const product = await Product.create(payload);

    const category = await Category.findByPk(product.categoryId);
    if (category) {
      category.productCount += 1;
      await category.save();
    }

    await logAudit(req, 'product.create', 'product', product.id, { name: product.name });
    res.status(201).json(product);
  } catch (error) {
    console.error('Admin create product error:', error);
    res.status(500).json({ error: 'Failed to create product', detail: error instanceof Error ? error.message : String(error) });
  }
});

router.put('/products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const oldCategoryId = product.categoryId;
    const { translations, ...rest } = req.body;
    if (translations) deriveFromTranslations(rest, translations, ['name', 'description', 'longDescription', 'brand']);
    Object.assign(product, rest);
    if (translations) product.translations = translations;
    await product.save();

    if (rest.categoryId && oldCategoryId !== rest.categoryId) {
      const oldCategory = await Category.findByPk(oldCategoryId);
      if (oldCategory && oldCategory.productCount > 0) {
        oldCategory.productCount -= 1;
        await oldCategory.save();
      }

      const newCategory = await Category.findByPk(rest.categoryId);
      if (newCategory) {
        newCategory.productCount += 1;
        await newCategory.save();
      }
    }

    await logAudit(req, 'product.update', 'product', product.id, { name: product.name });
    res.json(product);
  } catch (error) {
    console.error('Admin update product error:', error);
    res.status(500).json({ error: 'Failed to update product', detail: error instanceof Error ? error.message : String(error) });
  }
});

router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const category = await Category.findByPk(product.categoryId);
    if (category && category.productCount > 0) {
      category.productCount -= 1;
      await category.save();
    }

    const name = product.name;
    await product.destroy();
    await logAudit(req, 'product.delete', 'product', req.params.id, { name });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/products/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { ids, action, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array required' });
      return;
    }
    let affected = 0;
    if (action === 'delete') {
      affected = await Product.destroy({ where: { id: { [Op.in]: ids } } });
    } else if (action === 'feature') {
      [affected] = await Product.update({ featured: value !== false }, { where: { id: { [Op.in]: ids } } });
    } else if (action === 'activate') {
      [affected] = await Product.update({ isActive: value !== false }, { where: { id: { [Op.in]: ids } } });
    } else if (action === 'category' && value) {
      [affected] = await Product.update({ categoryId: value }, { where: { id: { [Op.in]: ids } } });
    } else {
      res.status(400).json({ error: 'Unknown action' });
      return;
    }
    await logAudit(req, `product.bulk.${action}`, 'product', undefined, { count: affected, ids });
    res.json({ affected });
  } catch (error) {
    console.error('Admin bulk product error:', error);
    res.status(500).json({ error: 'Failed bulk action' });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { translations, ...rest } = req.body;
    const payload: any = { ...rest };
    if (translations) payload.translations = translations;
    deriveFromTranslations(payload, translations, ['name', 'description']);
    const category = await Category.create(payload);
    await logAudit(req, 'category.create', 'category', category.id, { name: category.name });
    res.status(201).json(category);
  } catch (error) {
    console.error('Admin create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const { translations, ...rest } = req.body;
    if (translations) deriveFromTranslations(rest, translations, ['name', 'description']);
    Object.assign(category, rest);
    if (translations) category.translations = translations;
    await category.save();
    await logAudit(req, 'category.update', 'category', category.id, { name: category.name });
    res.json(category);
  } catch (error) {
    console.error('Admin update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const productCount = await Product.count({ where: { categoryId: category.id } });
    if (productCount > 0) {
      res.status(400).json({ error: 'Cannot delete category with products. Move or delete products first.' });
      return;
    }
    const name = category.name;
    await category.destroy();
    await logAudit(req, 'category.delete', 'category', req.params.id, { name });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Admin delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const totalUsers = await User.count({ where: { role: 'user' } });
    const totalOrders = await Order.count();
    const totalProducts = await Product.count();
    const totalCategories = await Category.count();

    const revenueResult = await Order.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']],
      where: { status: { [Op.notIn]: ['cancelled', 'pending'] } },
      raw: true,
    });
    const totalRevenue = parseFloat((revenueResult as any)?.total || 0);

    const lowStock = await Product.count({ where: { stock: { [Op.lt]: 5 }, isActive: true } });

    const ordersByStatus = await Order.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const recentOrders = await Order.findAll({
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalCategories,
      totalRevenue,
      lowStock,
      ordersByStatus: (ordersByStatus as any[]).map(o => ({ status: o.status, count: parseInt(o.count) })),
      recentOrders,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', detail: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/top-products', async (_req: Request, res: Response) => {
  try {
    const rows = await OrderItem.findAll({
      attributes: [
        'productId',
        'name',
        [fn('SUM', col('OrderItem.quantity')), 'sold']],
      where: { productId: { [Op.ne]: null } } as any,
      group: ['productId', 'name'],
      order: [[literal('sold'), 'DESC']],
      limit: 5,
      raw: true,
    });
    res.json(rows);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

router.get('/audit', async (req: Request, res: Response) => {
  try {
    const { limit = 100, action } = req.query;
    const where: any = {};
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
    });
    res.json(logs);
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

export default router;