import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sessionCookieOptions, signSession } from "@/lib/auth";
import { executeWithFallback } from "@/lib/db-retry";
import { createFallbackUser, getFallbackUserByEmail } from "@/lib/fallback-store";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";
import { hashPassword } from "@/lib/security";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid registration data" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const hashedPassword = await hashPassword(parsed.data.password);

    const { data: user, isFallback } = await executeWithFallback(
      async () => {
        await ensureStoreSeeded();

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error("EXISTS");
        }

        return prisma.user.create({
          data: {
            name: parsed.data.name,
            email,
            passwordHash: hashedPassword,
            role: UserRole.USER,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });
      },
      () => {
        const existingFallback = getFallbackUserByEmail(email);
        if (existingFallback) {
          throw new Error("EXISTS");
        }

        const created = createFallbackUser({
          name: parsed.data.name,
          email,
          passwordHash: hashedPassword,
          role: UserRole.USER,
        });

        return {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
        };
      },
      2500,
    );

    const response = NextResponse.json(
      { user },
      {
        status: 201,
        headers: {
          "x-data-source": isFallback ? "in-memory-fallback" : "supabase-postgres",
        },
      },
    );

    response.cookies.set({ ...sessionCookieOptions(), value: signSession(user) });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "EXISTS") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    console.error("[Register API] Error:", message);
    return NextResponse.json(
      { error: "Registration temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
