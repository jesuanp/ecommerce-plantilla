import { sequelize } from '../config/database.js';
import { Category, Product, User } from '../models/index.js';

const img = (seed: string, n: number = 1) =>
  `https://picsum.photos/seed/${seed}-${n}/800/800`;

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  image: string;
}

interface ProductSeed {
  name: string;
  brand: string;
  description: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categorySlug: string;
  tags: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
}

const categoriesData: CategorySeed[] = [
  {
    name: 'Audio',
    slug: 'audio',
    description: 'Premium headphones, speakers, and sound gear.',
    image: 'https://picsum.photos/seed/audio-category/800/600',
  },
  {
    name: 'Wearables',
    slug: 'wearables',
    description: 'Smartwatches, fitness bands, and connected accessories.',
    image: 'https://picsum.photos/seed/wearables-category/800/600',
  },
  {
    name: 'Home',
    slug: 'home',
    description: 'Design-led objects for everyday living spaces.',
    image: 'https://picsum.photos/seed/home-category/800/600',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Carry, charge, and connect — refined essentials.',
    image: 'https://picsum.photos/seed/accessories-category/800/600',
  },
];

const productsData: ProductSeed[] = [
  // AUDIO
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Aurora Wireless Headphones',
    brand: 'Lumen Audio',
    description: 'Studio-grade over-ear headphones with adaptive ANC.',
    longDescription:
      'The Aurora headphones deliver a 40-hour battery life, 40mm custom drivers, and adaptive active noise cancellation that learns your environment. Wrapped in memory-foam cushions and recycled aluminum, they are built to outlast every playlist.',
    price: 299,
    compareAtPrice: 349,
    images: [img('aurora-hp', 1), img('aurora-hp', 2), img('aurora-hp', 3), img('aurora-hp', 4)],
    categorySlug: 'audio',
    tags: ['wireless', 'noise-cancelling', 'over-ear'],
    stock: 24,
    rating: 4.8,
    reviewCount: 1284,
    featured: true,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Echo Mini Speaker',
    brand: 'Lumen Audio',
    description: 'Pocket-sized Bluetooth speaker with 360° sound.',
    longDescription:
      "Don't let the size fool you. The Echo Mini pumps out a full 360° soundstage from a 3-inch driver, is rated IPX7 waterproof, and lasts 18 hours per charge. Pair two for true stereo.",
    price: 79,
    images: [img('echo-mini', 1), img('echo-mini', 2), img('echo-mini', 3)],
    categorySlug: 'audio',
    tags: ['bluetooth', 'portable', 'waterproof'],
    stock: 52,
    rating: 4.6,
    reviewCount: 482,
    featured: false,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    name: 'Studio Pro Microphone',
    brand: 'Lumen Audio',
    description: 'Broadcast-quality USB-C condenser microphone.',
    longDescription:
      'Built for podcasters, streamers, and producers. Cardioid pattern, 192kHz/24-bit resolution, and a built-in pop filter. Plug-and-play on Mac, Windows, and Linux.',
    price: 189,
    images: [img('studio-mic', 1), img('studio-mic', 2), img('studio-mic', 3)],
    categorySlug: 'audio',
    tags: ['usb-c', 'streaming', 'studio'],
    stock: 17,
    rating: 4.9,
    reviewCount: 311,
    featured: false,
  },
  // WEARABLES
  {
    id: 'd4e5f6a7-b8c9-0123-def0-456789012345',
    name: 'Pulse Smartwatch',
    brand: 'Lumen Wear',
    description: 'Health-first smartwatch with 14-day battery.',
    longDescription:
      'The Pulse tracks 100+ workouts, heart rate, SpO2, sleep stages, and stress. A 14-day battery means you can leave the charger at home. AMOLED always-on display, sapphire glass, titanium body.',
    price: 349,
    images: [img('pulse-watch', 1), img('pulse-watch', 2), img('pulse-watch', 3), img('pulse-watch', 4)],
    categorySlug: 'wearables',
    tags: ['smartwatch', 'fitness', 'amoled'],
    stock: 31,
    rating: 4.7,
    reviewCount: 902,
    featured: true,
  },
  {
    id: 'e5f6a7b8-c9d0-1234-ef01-567890123456',
    name: 'Loop Fitness Band',
    brand: 'Lumen Wear',
    description: 'Slim fitness tracker with sleep coaching.',
    longDescription:
      'A featherweight band that does the heavy lifting. Continuous heart rate, advanced sleep coaching, and a 10-day battery in a body thinner than a pencil. Choose from three sizes and six colors.',
    price: 99,
    images: [img('loop-band', 1), img('loop-band', 2), img('loop-band', 3)],
    categorySlug: 'wearables',
    tags: ['fitness', 'tracker', 'lightweight'],
    stock: 88,
    rating: 4.5,
    reviewCount: 612,
    featured: false,
  },
  {
    id: 'f6a7b8c9-d0e1-2345-f012-678901234567',
    name: 'Aura Smart Ring',
    brand: 'Lumen Wear',
    description: 'Titanium smart ring for recovery & readiness.',
    longDescription:
      "Wearable tech you can't see. The Aura ring tracks HRV, skin temperature, and motion to give you a daily readiness score. No screen, no charging for 7 days, no compromises.",
    price: 299,
    compareAtPrice: 349,
    images: [img('aura-ring', 1), img('aura-ring', 2), img('aura-ring', 3)],
    categorySlug: 'wearables',
    tags: ['ring', 'recovery', 'titanium'],
    stock: 12,
    rating: 4.4,
    reviewCount: 207,
    featured: false,
  },
  // HOME
  {
    id: 'a7b8c9d0-e1f2-3456-0123-789012345678',
    name: 'Glow Ambient Lamp',
    brand: 'Lumen Home',
    description: '16M-color smart lamp with circadian presets.',
    longDescription:
      'Set the mood, the focus, or the wind-down. The Glow lamp pairs with HomeKit, Google Home, and Alexa, and ships with eight preset scenes tuned to your circadian rhythm.',
    price: 129,
    images: [img('glow-lamp', 1), img('glow-lamp', 2), img('glow-lamp', 3)],
    categorySlug: 'home',
    tags: ['lighting', 'smart-home', 'mood'],
    stock: 44,
    rating: 4.7,
    reviewCount: 521,
    featured: true,
  },
  {
    id: 'b8c9d0e1-f2a3-4567-1234-890123456789',
    name: 'Brew Pour-Over Kettle',
    brand: 'Lumen Home',
    description: 'Gooseneck kettle with temperature control.',
    longDescription:
      "Variable temperature from 40°C to 100°C, hold mode, and a precision gooseneck spout. The Brew kettle is the only kettle you'll ever need for tea, pour-over, and French press.",
    price: 149,
    images: [img('brew-kettle', 1), img('brew-kettle', 2), img('brew-kettle', 3)],
    categorySlug: 'home',
    tags: ['kitchen', 'coffee', 'stainless'],
    stock: 27,
    rating: 4.8,
    reviewCount: 388,
    featured: false,
  },
  {
    id: 'c9d0e1f2-a3b4-5678-2345-901234567890',
    name: 'Drift Diffuser',
    brand: 'Lumen Home',
    description: 'Ultrasonic aroma diffuser with timer.',
    longDescription:
      'A quiet, ultrasonic diffuser with 7 ambient LED colors and a 12-hour timer. Pairs perfectly with our line of pure essential oils. Real wood base, BPA-free.',
    price: 69,
    images: [img('drift-diffuser', 1), img('drift-diffuser', 2), img('drift-diffuser', 3)],
    categorySlug: 'home',
    tags: ['wellness', 'aroma', 'wood'],
    stock: 60,
    rating: 4.6,
    reviewCount: 244,
    featured: false,
  },
  // ACCESSORIES
  {
    id: 'd0e1f2a3-b4c5-6789-3456-012345678901',
    name: 'Cradle Wireless Charger',
    brand: 'Lumen Carry',
    description: 'MagSafe-compatible 15W wireless charger.',
    longDescription:
      'Charge any MagSafe-compatible device at full 15W. The Cradle uses a recycled aluminum body and a non-slip silicone base. Includes a USB-C cable and 30W power adapter.',
    price: 59,
    images: [img('cradle-charger', 1), img('cradle-charger', 2), img('cradle-charger', 3)],
    categorySlug: 'accessories',
    tags: ['wireless-charging', 'magsafe', 'travel'],
    stock: 73,
    rating: 4.5,
    reviewCount: 891,
    featured: false,
  },
  {
    id: 'e1f2a3b4-c5d6-7890-4567-123456789012',
    name: 'Atlas Daypack',
    brand: 'Lumen Carry',
    description: '22L water-resistant daypack, recycled fabric.',
    longDescription:
      'A 22L everyday carry made from 100% recycled ripstop nylon. Padded laptop sleeve, magnetic chest strap, and a hidden RFID-blocking pocket. Weather-sealed zippers for peace of mind.',
    price: 159,
    images: [img('atlas-pack', 1), img('atlas-pack', 2), img('atlas-pack', 3), img('atlas-pack', 4)],
    categorySlug: 'accessories',
    tags: ['bag', 'travel', 'recycled'],
    stock: 38,
    rating: 4.8,
    reviewCount: 415,
    featured: true,
  },
  {
    id: 'f2a3b4c5-d6e7-8901-5678-234567890123',
    name: 'Cuff Leather Wallet',
    brand: 'Lumen Carry',
    description: 'Slim vegetable-tanned leather wallet.',
    longDescription:
      'Full-grain Italian leather, hand-stitched in Florence. Holds up to 8 cards plus folded notes. Develops a unique patina over the years. RFID-protected.',
    price: 89,
    compareAtPrice: 110,
    images: [img('cuff-wallet', 1), img('cuff-wallet', 2), img('cuff-wallet', 3)],
    categorySlug: 'accessories',
    tags: ['leather', 'wallet', 'italian'],
    stock: 21,
    rating: 4.9,
    reviewCount: 256,
    featured: false,
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seed...');

    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    const categories: Category[] = [];
    for (const catData of categoriesData) {
      const category = await Category.create({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        image: catData.image,
        productCount: 0,
        translations: {
          en: { name: catData.name, description: catData.description },
        },
      } as any);
      categories.push(category);
    }
    console.log(`✅ Created ${categories.length} categories`);

    for (const prodData of productsData) {
      const category = categories.find(c => c.slug === prodData.categorySlug);
      if (!category) continue;

      await Product.create({
        id: prodData.id,
        name: prodData.name,
        brand: prodData.brand,
        description: prodData.description,
        longDescription: prodData.longDescription,
        price: prodData.price,
        compareAtPrice: prodData.compareAtPrice,
        images: prodData.images,
        categoryId: category.id,
        tags: prodData.tags,
        stock: prodData.stock,
        rating: prodData.rating,
        reviewCount: prodData.reviewCount,
        featured: prodData.featured,
        translations: {
          en: {
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
      email: 'admin@lumen.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    });
    console.log('✅ Created admin user (admin@lumen.com / admin123)');

    await User.create({
      email: 'test@lumen.com',
      password: 'user123',
      name: 'Test User',
      role: 'user',
    });
    console.log('✅ Created test user (test@lumen.com / user123)');

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
