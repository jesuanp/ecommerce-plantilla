import { sequelize, connectDB } from '../config/database.js';
import { seedDatabase } from '../seeders/seed.js';
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