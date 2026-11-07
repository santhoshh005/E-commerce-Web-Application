import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { executeWithFallback, unavailableResponse, writeFallback } from "@/lib/db-retry";
import { getFallbackUserById, updateFallbackUserPassword } from "@/lib/fallback-store";
import { prisma } from "@/lib/prisma";
import { rateLimitResponse } from "@/lib/rate-limit";
import { comparePassword, hashPassword } from "@/lib/security";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from the current password",
  });

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Sign in to change your password" }, { status: 401 });
    }

    const limited = rateLimitResponse(`password:user:${session.id}`, 5, 15 * 60 * 1000);
    if (limited) return limited;

    const parsed = passwordSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid password data" },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);

    await executeWithFallback(
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: session.id },
          select: { passwordHash: true },
        });
        if (!user || !(await comparePassword(parsed.data.currentPassword, user.passwordHash))) {
          throw new Error("INVALID_CURRENT_PASSWORD");
        }
        await prisma.user.update({ where: { id: session.id }, data: { passwordHash: newHash } });
        return true;
      },
      writeFallback(async () => {
        const user = getFallbackUserById(session.id);
        if (!user || !(await comparePassword(parsed.data.currentPassword, user.passwordHash))) {
          throw new Error("INVALID_CURRENT_PASSWORD");
        }
        updateFallbackUserPassword(session.id, newHash);
        return true;
      }),
      2500,
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const unavailable = unavailableResponse(error);
    if (unavailable) return unavailable;
    const message = error instanceof Error ? error.message : String(error);
    if (message === "INVALID_CURRENT_PASSWORD") {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    console.error("[Password API] Error:", message);
    return NextResponse.json(
      { error: "Password change temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
