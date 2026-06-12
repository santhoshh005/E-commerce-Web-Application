import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

const productUpdateSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().min(12).max(500).optional(),
    category: z.string().min(2).max(60).optional(),
    price: z.coerce.number().int().min(100).optional(),
    inventory: z.coerce.number().int().min(0).optional(),
    featured: z.coerce.boolean().optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field is required",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureStoreSeeded();

  const session = await getSessionUser();
  const { id } = await params;

  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const parsed = productUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product update" },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureStoreSeeded();

  const session = await getSessionUser();
  const { id } = await params;

  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // Delete any dependent order items first or let it cascade/error (SQLite restricts if references exist without cascade).
    // In our schema, OrderItem has productId and does not cascade. We should check if orderItems exist, or delete them or handle error.
    // If orderItems reference the product, deleting it directly might throw a foreign key constraint error.
    // Let's delete the product. If it throws, tell the user the product is referenced in active orders.
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Cannot delete product because it is referenced in past order histories." },
      { status: 400 },
    );
  }
}
