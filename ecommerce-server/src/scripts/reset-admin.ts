import { sequelize, connectDB } from '../config/database';
import { User } from '../models/index';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@raybertshop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  await connectDB();
  const user = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (!user) {
    console.error(`No user found with email ${ADMIN_EMAIL}`);
    process.exit(1);
  }
  user.password = ADMIN_PASSWORD;
  await user.save();
  console.log(`Password reset for ${ADMIN_EMAIL} (role=${user.role})`);
  await sequelize.close();
}

main().catch(err => { console.error(err); process.exit(1); });