import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { executeWithFallback } from "@/lib/db-retry";
import { createFallbackProduct, getFallbackProducts } from "@/lib/fallback-store";
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
  try {
    const { data: products, isFallback } = await executeWithFallback(
      async () => {
        await ensureStoreSeeded();
        return prisma.product.findMany({
          orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
        });
      },
      () => getFallbackProducts(),
      2500,
    );

    return NextResponse.json(
      { products },
      {
        headers: {
          "x-data-source": isFallback ? "in-memory-fallback" : "supabase-postgres",
        },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Products API] Error:", message);
    return NextResponse.json({ products: getFallbackProducts() });
  }
}

export async function POST(request: Request) {
  try {
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

    const { data: product, isFallback } = await executeWithFallback(
      async () => {
        await ensureStoreSeeded();
        return prisma.product.create({ data: parsed.data });
      },
      () => createFallbackProduct(parsed.data),
      2500,
    );

    return NextResponse.json(
      { product },
      {
        status: 201,
        headers: {
          "x-data-source": isFallback ? "in-memory-fallback" : "supabase-postgres",
        },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Products POST] Error:", message);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
