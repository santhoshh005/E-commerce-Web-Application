import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(12).max(500),
  category: z.string().min(2).max(60),
  price: z.coerce.number().int().min(100),
  inventory: z.coerce.number().int().min(0),
  featured: z.coerce.boolean().optional().default(false),
  rating: z.coerce.number().min(0).max(5).optional().default(4.5),
});

export async function GET() {
  await ensureStoreSeeded();

  const products = await prisma.product.findMany({
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  await ensureStoreSeeded();

  const session = await getSessionUser();

  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const parsed = productSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product data" },
      { status: 400 },
    );
  }

  const product = await prisma.product.create({ data: parsed.data });

  return NextResponse.json({ product }, { status: 201 });
}
