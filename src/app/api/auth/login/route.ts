import { NextResponse } from "next/server";
import { z } from "zod";

import { signSession } from "@/lib/auth";
import { executeWithFallback } from "@/lib/db-retry";
import { getFallbackUserByEmail } from "@/lib/fallback-store";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";
import { comparePassword } from "@/lib/security";
import { defaultAdmin } from "@/lib/store-data";

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid login data" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    const { data: user, isFallback } = await executeWithFallback(
      async () => {
        await ensureStoreSeeded();
        return prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordHash: true,
          },
        });
      },
      () => {
        const fallback = getFallbackUserByEmail(email);
        if (!fallback) return null;
        return {
          id: fallback.id,
          name: fallback.name,
          email: fallback.email,
          role: fallback.role,
          passwordHash: fallback.passwordHash,
        };
      },
      2500,
    );

    // Check credentials (including direct demo admin fallback)
    const isAdminDirect =
      email === defaultAdmin.email.toLowerCase() &&
      parsed.data.password === defaultAdmin.password;

    let isPasswordValid = false;
    if (isAdminDirect) {
      isPasswordValid = true;
    } else if (user) {
      isPasswordValid = await comparePassword(parsed.data.password, user.passwordHash);
    }

    if (!user && !isAdminDirect) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const sessionUser = {
      id: user?.id ?? "user-admin-fallback",
      name: user?.name ?? defaultAdmin.name,
      email: user?.email ?? defaultAdmin.email.toLowerCase(),
      role: user?.role ?? ("ADMIN" as const),
    };

    const response = NextResponse.json(
      { user: sessionUser },
      {
        headers: {
          "x-data-source": isFallback ? "in-memory-fallback" : "supabase-postgres",
        },
      },
    );

    response.cookies.set({
      name: "santhosh_store_session",
      value: signSession(sessionUser),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Login API] Error:", message);
    return NextResponse.json(
      { error: "Login temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
