import { sequelize, connectDB } from '../config/database';
import { seedDatabase } from '../seeders/seed';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  await connectDB();
  await seedDatabase();
  await sequelize.close();
  console.log('👋 Done — connection closed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});