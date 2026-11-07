import { NextResponse } from "next/server";
import { z } from "zod";

import { sessionCookieOptions, signSession } from "@/lib/auth";
import { executeWithFallback } from "@/lib/db-retry";
import { getFallbackUserByEmail } from "@/lib/fallback-store";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";
import { comparePassword, getDummyPasswordHash } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));

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

    // Always run a bcrypt comparison so response time does not reveal
    // whether the email exists.
    const isPasswordValid = await comparePassword(
      parsed.data.password,
      user?.passwordHash ?? getDummyPasswordHash(),
    );

    if (!user || !isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json(
      { user: sessionUser },
      {
        headers: {
          "x-data-source": isFallback ? "in-memory-fallback" : "supabase-postgres",
        },
      },
    );

    response.cookies.set({ ...sessionCookieOptions(), value: signSession(sessionUser) });

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
