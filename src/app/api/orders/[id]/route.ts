import { OrderStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
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
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureStoreSeeded();

  const session = await getSessionUser();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Sign in to view this order" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
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

  if (!order || (session.role !== UserRole.ADMIN && order.userId !== session.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: serializeOrder(order) });
}

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

  const parsed = statusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status update" },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.update({
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

    return NextResponse.json({ order: serializeOrder(order) });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
