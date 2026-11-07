import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { defaultAdmin, demoProducts } from "@/lib/store-data";

let seedPromise: Promise<void> | null = null;

async function seedStore() {
  if (defaultAdmin.password) {
    const adminCount = await prisma.user.count({
      where: { email: defaultAdmin.email },
    });

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
  }

  // Only seed demo products into an empty catalog, so products an admin
  // deleted or renamed are not recreated on the next cold start.
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: demoProducts.map((item) => ({ ...item })),
    });
  }
}

/**
 * Seeds the store once per server process. A successful seed is cached;
 * a failed seed is retried on the next request.
 */
export async function ensureStoreSeeded() {
  if (!seedPromise) {
    seedPromise = seedStore().catch((error: unknown) => {
      seedPromise = null;
      throw error;
    });
  }

  await seedPromise;
}
