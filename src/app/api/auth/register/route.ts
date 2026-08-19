import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { signSession } from "@/lib/auth";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";
import { hashPassword } from "@/lib/security";

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  try {
    await withDbRetry(() => ensureStoreSeeded());

    const parsed = registerSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid registration data" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await hashPassword(parsed.data.password),
        role: UserRole.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const response = NextResponse.json({ user }, { status: 201 });

    response.cookies.set({
      name: "santhosh_store_session",
      value: signSession(user),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Register API] Error:", message);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
