import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "santhosh_store_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET must be set");
  }

  return secret;
}

export function signSession(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string) {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function readSessionCookie() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser() {
  const token = await readSessionCookie();

  if (!token) {
    return null;
  }

  return verifySession(token);
}
