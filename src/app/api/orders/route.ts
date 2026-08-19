import { OrderStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
});

const checkoutSchema = z.object({
  items: z.array(orderItemSchema).min(1),
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
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: { id: string; name: string; category: string; price: number };
  }>;
}) {
  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    await withDbRetry(() => ensureStoreSeeded());

    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Sign in to view orders" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where:
        session.role === UserRole.ADMIN
          ? undefined
          : {
              userId: session.id,
            },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, category: true, price: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ orders: orders.map(serializeOrder) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Orders GET] Error:", message);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again.", orders: [] },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await withDbRetry(() => ensureStoreSeeded());

    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Sign in to place an order" }, { status: 401 });
    }

    const parsed = checkoutSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid checkout payload" },
        { status: 400 },
      );
    }

    const quantitiesByProductId = parsed.data.items.reduce<Record<string, number>>(
      (accumulator, item) => {
        accumulator[item.productId] = (accumulator[item.productId] ?? 0) + item.quantity;
        return accumulator;
      },
      {},
    );

    const productIds = Object.keys(quantitiesByProductId);

    const order = await prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more products are unavailable");
      }

      const productMap = new Map(products.map((product) => [product.id, product]));
      let subtotal = 0;

      for (const [productId, quantity] of Object.entries(quantitiesByProductId)) {
        const product = productMap.get(productId);

        if (!product || product.inventory < quantity) {
          throw new Error(`Insufficient inventory for ${product?.name ?? productId}`);
        }

        subtotal += product.price * quantity;
      }

      const shippingFee = subtotal >= 15000 ? 0 : 1200;

      const createdOrder = await transaction.order.create({
        data: {
          userId: session.id,
          status: OrderStatus.PENDING,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          items: {
            create: Object.entries(quantitiesByProductId).map(([productId, quantity]) => {
              const product = productMap.get(productId)!;

              return {
                productId,
                quantity,
                unitPrice: product.price,
                lineTotal: product.price * quantity,
              };
            }),
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, category: true, price: true },
              },
            },
          },
        },
      });

      await Promise.all(
        Object.entries(quantitiesByProductId).map(([productId, quantity]) =>
          transaction.product.update({
            where: { id: productId },
            data: { inventory: { decrement: quantity } },
          }),
        ),
      );

      return createdOrder;
    });

    return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Orders POST] Error:", message);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
