import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Product, Category } from '../models/index.js';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Locale = 'es' | 'en';

function detectLocale(req: Request): Locale {
  const fromQuery = (req.query.lang as string | undefined)?.toLowerCase();
  if (fromQuery === 'es' || fromQuery === 'en') return fromQuery;
  const al = (req.headers['accept-language'] || '').toLowerCase();
  if (al.startsWith('en')) return 'en';
  return 'es';
}

function withLocale<T extends { translations?: any }>(item: any, locale: Locale): any {
  const plain = item.get ? item.get({ plain: true }) : { ...item };
  const t = plain.translations || {};
  const tr = t[locale] || {};
  const fallback = t.en || {};
  return {
    ...plain,
    name: tr.name ?? fallback.name ?? plain.name,
    description: tr.description ?? fallback.description ?? plain.description,
    longDescription: tr.longDescription ?? fallback.longDescription ?? plain.longDescription,
    brand: tr.brand ?? fallback.brand ?? plain.brand,
    tags: tr.tags ?? fallback.tags ?? plain.tags,
    metaTitle: tr.metaTitle ?? fallback.metaTitle ?? plain.metaTitle,
    metaDescription: tr.metaDescription ?? fallback.metaDescription ?? plain.metaDescription,
  };
}

function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    description: p.description,
    longDescription: p.longDescription,
    price: parseFloat(p.price),
    compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
    images: p.images,
    category: p.category,
    categorySlug: p.category?.slug,
    tags: p.tags,
    stock: p.stock,
    rating: parseFloat(p.rating),
    reviewCount: p.reviewCount,
    featured: p.featured,
    isActive: p.isActive,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    translations: p.translations || {},
  };
}

function mapRelated(p: any) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: parseFloat(p.price),
    images: p.images,
    category: p.category,
    categorySlug: p.category?.slug,
    rating: parseFloat(p.rating),
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, q, sort, minPrice, maxPrice } = req.query;
    const locale = detectLocale(req);

    const where: any = { isActive: true };

    if (category) {
      const cat = await Category.findOne({ where: { slug: category as string } });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    if (q) {
      const searchTerm = `%${q}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: searchTerm } },
        { description: { [Op.iLike]: searchTerm } },
        { brand: { [Op.iLike]: searchTerm } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as any)[Op.gte] = parseFloat(minPrice as string);
      if (maxPrice) (where.price as any)[Op.lte] = parseFloat(maxPrice as string);
    }

    let order: any = [['createdAt', 'DESC']];
    if (sort) {
      switch (sort) {
        case 'price-asc':
          order = [['price', 'ASC']];
          break;
        case 'price-desc':
          order = [['price', 'DESC']];
          break;
        case 'rating':
          order = [['rating', 'DESC']];
          break;
        case 'featured':
          order = [['featured', 'DESC'], ['rating', 'DESC']];
          break;
        default:
          order = [['createdAt', 'DESC']];
      }
    }

    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
      order,
    });

    const result = products.map((p: any) => {
      const withLoc = withLocale(p, locale);
      return mapProduct(withLoc);
    });

    res.json(result);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/featured', async (req: Request, res: Response) => {
  try {
    const locale = detectLocale(req);
    const products = await Product.findAll({
      where: { featured: true, isActive: true },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
      order: [['rating', 'DESC']],
    });

    const result = products.map((p: any) => mapProduct(withLocale(p, locale)));
    res.json(result);
  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const locale = detectLocale(req);
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const related = await Product.findAll({
      where: {
        categoryId: (product as any).categoryId,
        id: { [Op.ne]: product.id },
      },
      limit: 4,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
    });

    const productWithLocale = withLocale(product, locale);
    res.json({
      product: mapProduct(productWithLocale),
      related: related.map((p: any) => {
        const rel = withLocale(p, locale);
        return mapRelated(rel);
      }),
    });
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;