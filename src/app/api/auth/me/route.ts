import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

export async function GET() {
  await ensureStoreSeeded();

  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ user });
}
