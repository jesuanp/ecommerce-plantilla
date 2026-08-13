import { sequelize, connectDB } from '../config/database';
import { User } from '../models/index';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  await connectDB();

  console.log('🧹 Dropping and recreating all tables (completely empty)...');
  await sequelize.sync({ force: true });
  console.log('✅ Tables recreated — no categories, no products, no orders, no users.');

  // Without this, there would be no way to log into /admin afterward.
  // Delete this block too if you genuinely want zero rows anywhere.
  await User.create({
    email: 'admin@raybertshop.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  } as any);
  console.log('✅ Recreated admin login: admin@raybertshop.com / admin123');

  await sequelize.close();
  console.log('👋 Done — connection closed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});