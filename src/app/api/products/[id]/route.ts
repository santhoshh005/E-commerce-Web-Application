import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { executeWithFallback, prismaErrorCode } from "@/lib/db-retry";
import {
  deleteFallbackProduct,
  updateFallbackProduct,
} from "@/lib/fallback-store";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

const productUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().min(12).max(500).optional(),
    category: z.string().min(2).max(60).optional(),
    price: z.coerce.number().int().min(100).max(100_000_000).optional(),
    inventory: z.coerce.number().int().min(0).max(1_000_000).optional(),
    featured: z.boolean().optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field is required",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  const { id } = await params;

  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const parsed = productUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product update" },
      { status: 400 },
    );
  }

  try {
    const { data: product } = await executeWithFallback(
      async () => {
        await ensureStoreSeeded();
        return prisma.product.update({
          where: { id },
          data: parsed.data,
        });
      },
      () => {
        const fallback = updateFallbackProduct(id, parsed.data);
        if (!fallback) {
          throw new Error("Product not found");
        }
        return fallback;
      },
      2500,
    );

    return NextResponse.json({ product });
  } catch (error: unknown) {
    if (prismaErrorCode(error) === "P2025" || (error instanceof Error && error.message === "Product not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("[Products PATCH] Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  const { id } = await params;

  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    await executeWithFallback(
      async () => {
        await ensureStoreSeeded();
        await prisma.product.delete({
          where: { id },
        });
        return true;
      },
      () => {
        const deleted = deleteFallbackProduct(id);
        if (!deleted) throw new Error("Product not found");
        return true;
      },
      2500,
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = prismaErrorCode(error);
    if (code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete product because it is referenced in past order histories." },
        { status: 409 },
      );
    }
    if (code === "P2025" || (error instanceof Error && error.message === "Product not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("[Products DELETE] Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
