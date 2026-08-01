import { Router, Request, Response } from 'express';
import { Category, Product } from '../models/index.js';

const router = Router();

type Locale = 'es' | 'en';

function detectLocale(req: Request): Locale {
  const fromQuery = (req.query.lang as string | undefined)?.toLowerCase();
  if (fromQuery === 'es' || fromQuery === 'en') return fromQuery;
  const al = (req.headers['accept-language'] || '').toLowerCase();
  if (al.startsWith('en')) return 'en';
  return 'es';
}

function withLocale<T extends { translations?: any }>(item: T, locale: Locale): T {
  const t = item.translations || {};
  const tr = t[locale] || {};
  const fallback = t.en || {};
  return {
    ...item,
    name: tr.name ?? fallback.name ?? item.name,
    description: tr.description ?? fallback.description ?? item.description,
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const locale = detectLocale(req);
    const categories = await Category.findAll({
      include: [{ model: Product, as: 'products', attributes: [], where: { isActive: true }, required: false }],
      attributes: {
        include: [
          [Category.sequelize!.fn('COUNT', Category.sequelize!.col('products.id')), 'productCountReal'],
        ],
      },
      group: ['Category.id'],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    const result = categories.map((cat: any) => {
      const withLoc = withLocale(cat, locale);
      return {
        id: cat.id,
        name: withLoc.name,
        slug: cat.slug,
        description: withLoc.description,
        image: cat.image,
        productCount: parseInt(cat.productCountReal || cat.productCount || 0),
        isVisible: cat.isVisible,
        sortOrder: cat.sortOrder,
        translations: cat.translations || {},
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const locale = detectLocale(req);
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const withLoc = withLocale(category, locale);
    res.json({ ...withLoc, translations: (category as any).translations || {} });
  } catch (error) {
    console.error('Category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const locale = detectLocale(req);
    const category = await Category.findOne({ where: { slug: req.params.slug } });
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const withLoc = withLocale(category, locale);
    res.json({ ...withLoc, translations: (category as any).translations || {} });
  } catch (error) {
    console.error('Category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

export default router;