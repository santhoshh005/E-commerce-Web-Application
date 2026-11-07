import { OrderStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { executeWithFallback, prismaErrorCode } from "@/lib/db-retry";
import {
  getFallbackOrderById,
  updateFallbackOrderStatus,
} from "@/lib/fallback-store";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

const statusSchema = z.object({
  status: z.enum(OrderStatus),
});

function serializeOrder(order: {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string; email: string; role: UserRole };
  items: Array<unknown>;
}) {
  return {
    ...order,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Sign in to view this order" }, { status: 401 });
  }

  let order;
  try {
    ({ data: order } = await executeWithFallback(
    async () => {
      await ensureStoreSeeded();
      return prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, category: true, price: true } },
            },
          },
        },
      });
    },
    () => {
      return getFallbackOrderById(id) ?? null;
    },
    2500,
  ));
  } catch (error: unknown) {
    console.error("[Order GET] Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Could not load order" }, { status: 500 });
  }

  if (!order || (session.role !== UserRole.ADMIN && order.userId !== session.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: serializeOrder(order) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  const { id } = await params;

  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status update" },
      { status: 400 },
    );
  }

  try {
    const { data: order } = await executeWithFallback(
      async () => {
        await ensureStoreSeeded();
        return prisma.order.update({
          where: { id },
          data: { status: parsed.data.status },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, category: true, price: true } },
              },
            },
          },
        });
      },
      () => {
        const updated = updateFallbackOrderStatus(id, parsed.data.status);
        if (!updated) throw new Error("Order not found");
        return updated;
      },
      2500,
    );

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error: unknown) {
    if (prismaErrorCode(error) === "P2025" || (error instanceof Error && error.message === "Order not found")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    console.error("[Order PATCH] Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
