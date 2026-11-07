import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "santhosh_store_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: SESSION_MAX_AGE_SECONDS },
  );
}

export function verifySession(token: string) {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as SessionUser;
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

/** Cookie options shared by login, register and logout. */
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
