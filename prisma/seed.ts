import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email,
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });
}

void main()
  .catch(async (error: unknown) => {
    // 这里保留启动阶段日志，方便快速定位 seed 问题。
    console.error('Seed 执行失败:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
