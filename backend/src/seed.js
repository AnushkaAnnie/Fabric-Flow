const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Seed admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });
  console.log(`Created admin user: ${admin.username} / admin123`);

  // Seed some basic master data
  const colours = ['Red', 'Blue', 'Black', 'White'];
  for (const c of colours) {
    await prisma.colour.upsert({
      where: { name: c },
      update: {},
      create: { name: c },
    });
  }

  const washTypes = ['Normal', 'Bio Wash', 'Silicone Wash'];
  for (const w of washTypes) {
    await prisma.washType.upsert({
      where: { name: w },
      update: {},
      create: { name: w },
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
