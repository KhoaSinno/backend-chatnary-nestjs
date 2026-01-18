import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Administrator',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  // Create guest user
  await prisma.user.upsert({
    where: { email: 'sinoo@example.com' },
    update: {},
    create: {
      email: 'sinoo@example.com',
      username: 'sinoo',
      name: 'sinoo',
      password: passwordHash,
      role: Role.USER,
    },
  });

  // 2. Create sample projects for this user
  const project1 = await prisma.project.create({
    data: {
      name: 'AI Văn Bản',
      description: 'Project dùng để test RAG + OCR',
      userId: user.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Thư Viện Số',
      description: 'Project số hóa tài liệu PDF',
      userId: user.id,
    },
  });

  console.log('📁 Projects created:');
  console.log('  -', project1.id);
  console.log('  -', project2.id);

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
