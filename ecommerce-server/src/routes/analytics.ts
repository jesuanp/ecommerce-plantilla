import { Router } from 'express';
import { fn, col, literal, Op } from 'sequelize';
import { Order, OrderItem, Product, Category } from '../models/index';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/overview', async (_req, res) => {
  try {
    const totalOrders = await Order.count({
      where: { status: { [Op.notIn]: ['cancelled'] } },
    });

    const revenueResult = await Order.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']],
      where: { status: { [Op.notIn]: ['cancelled', 'pending'] } },
      raw: true,
    });
    const totalRevenue = parseFloat((revenueResult as any)?.total || 0);
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const monthResult = await Order.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']],
      where: {
        status: { [Op.notIn]: ['cancelled', 'pending'] },
        createdAt: { [Op.gte]: startOfMonth },
      },
      raw: true,
    });
    const monthRevenue = parseFloat((monthResult as any)?.total || 0);

    const prevMonthResult = await Order.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']],
      where: {
        status: { [Op.notIn]: ['cancelled', 'pending'] },
        createdAt: { [Op.gte]: startOfPrevMonth, [Op.lte]: endOfPrevMonth },
      },
      raw: true,
    });
    const prevMonthRevenue = parseFloat((prevMonthResult as any)?.total || 0);
    const monthGrowth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

    res.json({
      totalOrders,
      totalRevenue,
      aov,
      monthRevenue,
      prevMonthRevenue,
      monthGrowth,
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const days = parseInt((req.query.days as string) || '30');
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await Order.findAll({
      attributes: [
        [literal("DATE(\"createdAt\")"), 'date'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        status: { [Op.notIn]: ['cancelled', 'pending'] },
        createdAt: { [Op.gte]: since },
      },
      group: [literal('date')],
      order: [[literal('date'), 'ASC']],
      raw: true,
    });

    const series = (orders as any[]).map(o => ({
      date: o.date,
      revenue: parseFloat(o.revenue),
      count: parseInt(o.count),
    }));

    res.json(series);
  } catch (error) {
    console.error('Analytics sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

router.get('/by-category', async (_req, res) => {
  try {
    const rows: any = await OrderItem.findAll({
      attributes: [
        [fn('COALESCE', fn('SUM', literal('"OrderItem"."quantity" * "OrderItem"."price"')), 0), 'revenue'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id'],
          include: [{ model: Category, as: 'category', attributes: ['name'] }],
        },
      ],
      group: ['product.id', 'product->category.id', 'product->category.name'],
      raw: true,
      nest: true,
    });

    const map = new Map<string, number>();
    for (const r of rows) {
      const name = r.product?.category?.name;
      if (!name) continue;
      const rev = parseFloat(r.revenue);
      map.set(name, (map.get(name) || 0) + rev);
    }
    const data = Array.from(map.entries()).map(([name, revenue]) => ({ name, revenue }));
    res.json(data);
  } catch (error) {
    console.error('Analytics by-category error:', error);
    res.status(500).json({ error: 'Failed to fetch category analytics', detail: error instanceof Error ? error.message : String(error) });
  }
});

export default router;