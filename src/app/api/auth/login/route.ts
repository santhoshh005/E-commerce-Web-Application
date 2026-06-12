import { NextResponse } from "next/server";
import { z } from "zod";

import { signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";
import { comparePassword } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  await ensureStoreSeeded();

  const parsed = loginSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid login data" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user || !(await comparePassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const response = NextResponse.json({ user: sessionUser });

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
}
