import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { defaultAdmin, demoProducts } from "@/lib/store-data";

let seedPromise: Promise<void> | null = null;

async function seedStore() {
  const [adminCount, productCount] = await Promise.all([
    prisma.user.count({ where: { email: defaultAdmin.email } }),
    prisma.product.count(),
  ]);

  if (adminCount === 0) {
    await prisma.user.create({
      data: {
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        passwordHash: await hashPassword(defaultAdmin.password),
        role: UserRole.ADMIN,
      },
    });
  }

  if (productCount === 0) {
    await prisma.product.createMany({ data: [...demoProducts] });
  }
}

export async function ensureStoreSeeded() {
  if (!seedPromise) {
    seedPromise = seedStore().finally(() => {
      seedPromise = null;
    });
  }

  await seedPromise;
}
