import fs from 'fs';
import path from 'path';
import { sequelize } from '../config/database.js';
import { Category, Product, User } from '../models/index.js';
import { UPLOAD_DIR, PRODUCTS_SUBDIR, publicUrlFor } from '../lib/uploads.js';

// Real product photos live in ecommerce-server/seed-assets/products/ (kept
// in the repo, unlike UPLOAD_DIR which is git-ignored). Seeding copies each
// one into UPLOAD_DIR/products/ and points the product at that copy — so
// after seeding, product images are served exactly like any admin-uploaded
// image, through /uploads/products/<file>, no external placeholder URLs.
const SEED_ASSETS_DIR = path.resolve(process.cwd(), 'seed-assets', 'products');

/**
 * Resolves a seed image by base name, trying common extensions, copies it
 * into the real uploads directory, and returns its public URL. Throws with
 * a clear message if the file is missing, since a silently-broken product
 * photo is worse than a loud failure during seeding.
 */
function seedImage(baseName: string): string {
  // Create the folder if it's missing entirely, so the error below can
  // list its (empty) contents instead of failing with an unrelated
  // "directory doesn't exist" error.
  fs.mkdirSync(SEED_ASSETS_DIR, { recursive: true });

  const candidates = ['.jpg', '.jpeg', '.png', '.webp'].map(ext => `${baseName}${ext}`);
  const found = candidates.find(name => fs.existsSync(path.join(SEED_ASSETS_DIR, name)));

  if (!found) {
    const actuallyThere = fs.readdirSync(SEED_ASSETS_DIR);
    throw new Error(
      `Seed image not found for "${baseName}". Expected one of: ${candidates.join(', ')}\n` +
      `Looked inside: ${SEED_ASSETS_DIR}\n` +
      `Files actually found there: ${actuallyThere.length ? actuallyThere.join(', ') : '(empty — nothing is in this folder yet)'}`
    );
  }

  const destDir = path.join(UPLOAD_DIR, PRODUCTS_SUBDIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, found);
  fs.copyFileSync(path.join(SEED_ASSETS_DIR, found), destPath);

  return publicUrlFor(PRODUCTS_SUBDIR, found);
}

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  image: string;
}

interface ProductSeed {
  id: string;
  name: string;
  brand: string;
  description: string;
  longDescription: string;
  price: number;
  imageFile: string;
  categorySlug: string;
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
}

const categoriesData: CategorySeed[] = [
  {
    name: 'Máquinas y Afeitadoras',
    slug: 'maquinas-y-afeitadoras',
    description: 'Máquinas de corte y afeitadoras eléctricas para barbería profesional.',
    image: '', // filled in below from the first product's photo
  },
  {
    name: 'Ceras y Texturizadores',
    slug: 'ceras-y-texturizadores',
    description: 'Ceras, pomadas y texturizadores para el acabado perfecto del peinado.',
    image: '',
  },
];

const productsData: ProductSeed[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Afeitadora Philips OneBlade Face',
    brand: 'Philips',
    description: 'Recorta, perfila y afeita cualquier largo de vello facial en un solo paso.',
    longDescription:
      'La Philips OneBlade Face es ideal para quien necesita versatilidad: corta, perfila los bordes y afeita, todo con la misma cuchilla. No necesita recargarse antes de cada uso gracias a su batería de larga duración, y su cuchilla autoafilable dura hasta 4 meses de uso regular.',
    price: 39.99,
    imageFile: 'maquina-phillips',
    categorySlug: 'maquinas-y-afeitadoras',
    tags: ['afeitadora', 'philips', 'oneblade', 'barberia'],
    stock: 25,
    rating: 4.7,
    reviewCount: 138,
    featured: true,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    name: 'Máquina de Corte Profesional Inalámbrica',
    brand: 'Raybert Pro',
    description: 'Máquina de corte inalámbrica con cuchillas de acero y carga USB.',
    longDescription:
      'Diseñada para cortes de precisión en barbería. Incluye peines guía intercambiables, cuchillas de acero de alta duración y cable de carga USB para mayor autonomía en el salón.',
    price: 49.99,
    imageFile: 'maquina',
    categorySlug: 'maquinas-y-afeitadoras',
    tags: ['maquina', 'corte', 'barberia', 'inalambrica'],
    stock: 30,
    rating: 4.8,
    reviewCount: 205,
    featured: true,
  },
  {
    id: 'd4e5f6a7-b8c9-0123-def0-456789012345',
    name: 'Cera Shine Alto Brillo',
    brand: 'Shine',
    description: 'Cera de fijación fuerte con acabado de alto brillo.',
    longDescription:
      'Ideal para peinados clásicos de barbería que buscan un acabado brillante y una fijación duradera durante todo el día. Fácil de aplicar y de remover con agua.',
    price: 12.99,
    imageFile: 'cera-shiner',
    categorySlug: 'ceras-y-texturizadores',
    tags: ['cera', 'brillo', 'peinado', 'barberia'],
    stock: 60,
    rating: 4.5,
    reviewCount: 76,
    featured: false,
  },
  {
    id: 'e5f6a7b8-c9d0-1234-ef01-567890123456',
    name: 'Cera B Barber Pomade',
    brand: 'Cera B',
    description: 'Pomada mate de fijación media para peinados de barbería.',
    longDescription:
      'Una pomada versátil que ofrece control sin dejar residuo graso, perfecta para peinados con acabado mate y textura natural.',
    price: 14.99,
    imageFile: 'cera-b',
    categorySlug: 'ceras-y-texturizadores',
    tags: ['pomada', 'cera', 'mate', 'barberia'],
    stock: 55,
    rating: 4.6,
    reviewCount: 61,
    featured: false,
  },
  {
    id: 'f6a7b8c9-d0e1-2345-f012-678901234567',
    name: 'Polvo Texturizador para Cabello',
    brand: 'Raybert Pro',
    description: 'Polvo texturizador que da volumen y acabado mate al instante.',
    longDescription:
      'Aplica un toque de polvo texturizador en la raíz para lograr volumen instantáneo y una textura mate que dura todo el día, sin apelmazar el cabello.',
    price: 9.99,
    imageFile: 'polvo-texturizador',
    categorySlug: 'ceras-y-texturizadores',
    tags: ['polvo', 'texturizador', 'volumen', 'barberia'],
    stock: 70,
    rating: 4.4,
    reviewCount: 45,
    featured: false,
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seed...');

    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // Resolve every product's image up front. If a file is missing, this
    // throws before anything is written to the database — better to fail
    // loudly here than to seed products with broken image links.
    const resolvedImages = new Map<string, string>();
    for (const prod of productsData) {
      resolvedImages.set(prod.imageFile, seedImage(prod.imageFile));
    }

    // Use the first product photo of each category as that category's
    // cover image, so categories don't need separate standalone photos.
    for (const cat of categoriesData) {
      const firstProduct = productsData.find(p => p.categorySlug === cat.slug);
      if (firstProduct) cat.image = resolvedImages.get(firstProduct.imageFile)!;
    }

    const categories: Category[] = [];
    for (const catData of categoriesData) {
      const category = await Category.create({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        image: catData.image,
        productCount: 0,
        translations: {
          es: { name: catData.name, description: catData.description },
        },
      } as any);
      categories.push(category);
    }
    console.log(`✅ Created ${categories.length} categories`);

    for (const prodData of productsData) {
      const category = categories.find(c => c.slug === prodData.categorySlug);
      if (!category) continue;

      const imageUrl = resolvedImages.get(prodData.imageFile)!;

      await Product.create({
        id: prodData.id,
        name: prodData.name,
        brand: prodData.brand,
        description: prodData.description,
        longDescription: prodData.longDescription,
        price: prodData.price,
        images: [imageUrl],
        categoryId: category.id,
        tags: prodData.tags,
        stock: prodData.stock,
        rating: prodData.rating,
        reviewCount: prodData.reviewCount,
        featured: prodData.featured,
        translations: {
          es: {
            name: prodData.name,
            description: prodData.description,
            longDescription: prodData.longDescription,
            brand: prodData.brand,
            tags: prodData.tags,
            metaTitle: '',
            metaDescription: '',
          },
        },
      } as any);

      category.productCount += 1;
      await category.save();
    }
    console.log(`✅ Created ${productsData.length} products`);

    await User.create({
      email: 'admin@raybertshop.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    } as any);
    console.log('✅ Created admin user (admin@raybertshop.com / admin123)');

    await User.create({
      email: 'test@raybertshop.com',
      password: 'user123',
      name: 'Test User',
      role: 'user',
    } as any);
    console.log('✅ Created test user (test@raybertshop.com / user123)');

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}