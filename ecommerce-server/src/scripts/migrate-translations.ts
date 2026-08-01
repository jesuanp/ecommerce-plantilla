import { sequelize } from '../config/database.js';
import { Category, Product } from '../models/index.js';

async function migrate() {
  console.log('🌐 Populating translations.en for existing products and categories…');

  const categories = await Category.findAll();
  for (const c of categories) {
    const existing = (c as any).translations || {};
    if (existing.en && Object.keys(existing.en).length > 0) continue;
    await Category.update(
      {
        translations: {
          ...existing,
          en: {
            name: c.name,
            description: c.description,
          },
        },
      } as any,
      { where: { id: c.id } }
    );
    console.log(`  ✓ Category "${c.name}" → translations.en populated`);
  }

  const products = await Product.findAll();
  for (const p of products) {
    const existing = (p as any).translations || {};
    if (existing.en && Object.keys(existing.en).length > 0) continue;
    await Product.update(
      {
        translations: {
          ...existing,
          en: {
            name: p.name,
            description: p.description,
            longDescription: p.longDescription,
            brand: p.brand,
            tags: p.tags || [],
            metaTitle: (p as any).metaTitle || '',
            metaDescription: (p as any).metaDescription || '',
          },
        },
      } as any,
      { where: { id: p.id } }
    );
    console.log(`  ✓ Product "${p.name}" → translations.en populated`);
  }

  console.log('✅ Done.');
}

migrate()
  .then(() => sequelize.close())
  .catch(err => {
    console.error('Migration failed:', err);
    sequelize.close();
    process.exit(1);
  });