import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { executeWithFallback } from "@/lib/db-retry";
import { getFallbackUserById } from "@/lib/fallback-store";
import { prisma } from "@/lib/prisma";
import { ensureStoreSeeded } from "@/lib/seed";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const { data: user } = await executeWithFallback(
      async () => {
        await ensureStoreSeeded();
        return prisma.user.findUnique({
          where: { id: session.id },
          select: { id: true, name: true, email: true, role: true },
        });
      },
      () => {
        const fallback = getFallbackUserById(session.id);
        if (fallback) {
          return {
            id: fallback.id,
            name: fallback.name,
            email: fallback.email,
            role: fallback.role,
          };
        }
        return session;
      },
      2500,
    );

    return NextResponse.json({ user: user ?? session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Auth Me API] Error:", message);
    const session = await getSessionUser().catch(() => null);
    return NextResponse.json({ user: session ?? null });
  }
}
