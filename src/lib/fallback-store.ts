import { OrderStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { defaultAdmin, demoProducts } from "@/lib/store-data";

export type FallbackProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  inventory: number;
  featured: boolean;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FallbackUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type FallbackOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
};

export type FallbackOrder = {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  items: FallbackOrderItem[];
};

// Global singleton to persist across hot-reloads and serverless execution invocations
const globalForFallback = globalThis as unknown as {
  fallbackProducts?: FallbackProduct[];
  fallbackUsers?: FallbackUser[];
  fallbackOrders?: FallbackOrder[];
};

function initialProducts(): FallbackProduct[] {
  const now = new Date("2026-08-01T10:00:00.000Z");
  return demoProducts.map((p, index) => ({
    id: `prod-fallback-${index + 1}`,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    inventory: p.inventory,
    featured: p.featured,
    rating: p.rating,
    createdAt: new Date(now.getTime() - index * 3600000),
    updatedAt: new Date(now.getTime() - index * 1800000),
  }));
}

const isProduction = process.env.NODE_ENV === "production";

function initialUsers(): FallbackUser[] {
  const users: FallbackUser[] = [];

  // The fallback admin mirrors the seeded admin and uses the same
  // env-provided password; it is omitted when no admin password is set.
  if (defaultAdmin.password) {
    users.push({
      id: "user-admin-fallback",
      name: defaultAdmin.name,
      email: defaultAdmin.email,
      passwordHash: bcrypt.hashSync(defaultAdmin.password, 10),
      role: UserRole.ADMIN,
      createdAt: new Date("2026-07-01T12:00:00.000Z"),
      updatedAt: new Date("2026-07-01T12:00:00.000Z"),
    });
  }

  // Demo shopper with a publicly known password: development only.
  if (!isProduction) {
    users.push({
      id: "user-demo-shopper",
      name: "Demo Shopper",
      email: "shopper@santhosh.store",
      // Precomputed bcrypt hash of the demo password "Admin123!"
      passwordHash: "$2b$10$iRpzM4KDdwRwy6I0OLI0.u3UuChLja/jPJY0rE188jWR8iA9qrB5K",
      role: UserRole.USER,
      createdAt: new Date("2026-07-15T10:00:00.000Z"),
      updatedAt: new Date("2026-07-15T10:00:00.000Z"),
    });
  }

  return users;
}

function initialOrders(products: FallbackProduct[]): FallbackOrder[] {
  const p1 = products[0]; // Aurora Knit Sneaker ($96.00)
  const p6 = products[5]; // Pulse Wireless Earbuds ($149.00)

  if (isProduction || !p1 || !p6) return [];

  const subtotal = p1.price * 1 + p6.price * 1;
  const shippingFee = subtotal >= 15000 ? 0 : 1200;

  return [
    {
      id: "ord-sample-01",
      userId: "user-demo-shopper",
      status: OrderStatus.DELIVERED,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      createdAt: new Date("2026-08-10T14:30:00.000Z"),
      updatedAt: new Date("2026-08-12T16:00:00.000Z"),
      user: {
        id: "user-demo-shopper",
        name: "Demo Shopper",
        email: "shopper@santhosh.store",
        role: UserRole.USER,
      },
      items: [
        {
          id: "item-sample-01",
          orderId: "ord-sample-01",
          productId: p1.id,
          quantity: 1,
          unitPrice: p1.price,
          lineTotal: p1.price * 1,
          product: {
            id: p1.id,
            name: p1.name,
            category: p1.category,
            price: p1.price,
          },
        },
        {
          id: "item-sample-02",
          orderId: "ord-sample-01",
          productId: p6.id,
          quantity: 1,
          unitPrice: p6.price,
          lineTotal: p6.price * 1,
          product: {
            id: p6.id,
            name: p6.name,
            category: p6.category,
            price: p6.price,
          },
        },
      ],
    },
  ];
}

export function getFallbackProducts(): FallbackProduct[] {
  if (!globalForFallback.fallbackProducts) {
    globalForFallback.fallbackProducts = initialProducts();
  }
  return [...globalForFallback.fallbackProducts].sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export function createFallbackProduct(data: {
  name: string;
  description: string;
  category: string;
  price: number;
  inventory: number;
  featured?: boolean;
  rating?: number;
}): FallbackProduct {
  const products = getFallbackProducts();
  const newProduct: FallbackProduct = {
    id: `prod-fallback-${Date.now()}`,
    name: data.name,
    description: data.description,
    category: data.category,
    price: data.price,
    inventory: data.inventory,
    featured: data.featured ?? false,
    rating: data.rating ?? 4.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  globalForFallback.fallbackProducts = [newProduct, ...products];
  return newProduct;
}

export function updateFallbackProduct(
  id: string,
  data: Partial<Omit<FallbackProduct, "id" | "createdAt" | "updatedAt">>,
): FallbackProduct | null {
  const products = getFallbackProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const existing = products[index]!;
  const updated: FallbackProduct = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };

  products[index] = updated;
  globalForFallback.fallbackProducts = products;
  return updated;
}

export function deleteFallbackProduct(id: string): boolean {
  const products = getFallbackProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  globalForFallback.fallbackProducts = filtered;
  return true;
}

export function getFallbackUsers(): FallbackUser[] {
  if (!globalForFallback.fallbackUsers) {
    globalForFallback.fallbackUsers = initialUsers();
  }
  return globalForFallback.fallbackUsers;
}

export function getFallbackUserByEmail(email: string): FallbackUser | undefined {
  const users = getFallbackUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getFallbackUserById(id: string): FallbackUser | undefined {
  const users = getFallbackUsers();
  return users.find((u) => u.id === id);
}

export function createFallbackUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}): FallbackUser {
  const users = getFallbackUsers();
  const newUser: FallbackUser = {
    id: `user-fallback-${Date.now()}`,
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: data.role ?? UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  globalForFallback.fallbackUsers = [...users, newUser];
  return newUser;
}

export function getFallbackOrders(userId?: string, isAdmin?: boolean): FallbackOrder[] {
  if (!globalForFallback.fallbackOrders) {
    const products = getFallbackProducts();
    globalForFallback.fallbackOrders = initialOrders(products);
  }

  const allOrders = [...globalForFallback.fallbackOrders].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  if (isAdmin) {
    return allOrders;
  }

  if (userId) {
    return allOrders.filter((o) => o.userId === userId);
  }

  return [];
}

export function getFallbackOrderById(id: string): FallbackOrder | undefined {
  const orders = getFallbackOrders(undefined, true);
  return orders.find((o) => o.id === id);
}

export function createFallbackOrder(data: {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  user?: { id: string; name: string; email: string; role: UserRole };
}): FallbackOrder {
  const products = getFallbackProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItems: FallbackOrderItem[] = [];
  const orderId = `ord-fallback-${Date.now()}`;

  // Validate every line before mutating inventory so a failing line
  // does not leave earlier lines partially decremented.
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error("One or more products are unavailable");
    }
    if (product.inventory < item.quantity) {
      throw new Error(`Insufficient inventory for ${product.name}`);
    }
  }

  for (const item of data.items) {
    const product = productMap.get(item.productId)!;

    // Decrement inventory
    product.inventory -= item.quantity;
    product.updatedAt = new Date();

    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      id: `item-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      },
    });
  }

  const shippingFee = subtotal >= 15000 ? 0 : 1200;
  const total = subtotal + shippingFee;

  const newOrder: FallbackOrder = {
    id: orderId,
    userId: data.userId,
    status: OrderStatus.PAID,
    subtotal,
    shippingFee,
    total,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: data.user,
    items: orderItems,
  };

  const existing = getFallbackOrders(undefined, true);
  globalForFallback.fallbackOrders = [newOrder, ...existing];

  return newOrder;
}

export function updateFallbackOrderStatus(id: string, status: OrderStatus): FallbackOrder | null {
  const orders = getFallbackOrders(undefined, true);
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const updated: FallbackOrder = {
    ...orders[index]!,
    status,
    updatedAt: new Date(),
  };

  orders[index] = updated;
  globalForFallback.fallbackOrders = orders;
  return updated;
}
