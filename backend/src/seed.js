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

  // Seed yarn receipts (sample inbound records)
  // Find the first yarn in the database
  const yarn = await prisma.yarn.findFirst();
  if (yarn) {
    await prisma.yarnReceipt.upsert({
      where: { id: 1 },
      update: {},
      create: {
        yarnId: yarn.id,
        quantity: 50,
        dcNo: 'DC-RECEIPT-001',
        notes: 'Sample yarn receipt from supplier',
        receiptDate: new Date('2026-04-15'),
      },
    });
    console.log('Created sample yarn receipt.');
  }

  // Seed grey fabric specs for first knitting record
  const knitting = await prisma.knitting.findFirst();
  if (knitting && !knitting.greyFabric) {
    const greyFabric = await prisma.greyFabric.create({
      data: {
        knittingId: knitting.id,
        description: 'Cotton Jersey',
        gauge: '20',
        loopLength: 2.5,
        diameter: 1.2,
        gsm: 150,
        quantity: 100,
      },
    });
    console.log('Created sample grey fabric specs.');
  }

  // Seed dyeing order with lots
  const knittings = await prisma.knitting.findMany({ take: 2 });
  if (knittings.length > 0) {
    const lotsData = [];
    for (const k of knittings) {
      const grey = await prisma.greyFabric.findUnique({ where: { knittingId: k.id } });
      if (grey) {
        lotsData.push({
          knittingId: k.id,
          colour: 'Sample Red',
          weight: Math.min(50, grey.quantity / 2),
        });
      }
    }

    if (lotsData.length > 0) {
      try {
        const order = await prisma.dyeingOrder.create({
          data: {
            dcNo: 'DC-ORDER-001',
            dyerName: 'Sample Dyer',
            issueDate: new Date(),
            notes: 'Sample dyeing order',
            lots: {
              create: lotsData,
            },
          },
        });
        console.log('Created sample dyeing order.');
      } catch (e) {
        console.log('Could not create sample dyeing order (may already exist or missing grey fabric).');
      }
    }
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
