import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { defaultAdmin, demoProducts } from "@/lib/store-data";

let seedPromise: Promise<void> | null = null;

async function seedStore() {
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

  for (const item of demoProducts) {
    const exists = await prisma.product.findFirst({
      where: { name: item.name },
    });
    if (!exists) {
      await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price,
          inventory: item.inventory,
          featured: item.featured,
          rating: item.rating,
        },
      });
    }
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
