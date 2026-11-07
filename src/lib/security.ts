import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

let dummyHash: string | null = null;

/**
 * A real bcrypt hash of a random value. Comparing against it when a user
 * does not exist keeps login timing the same for unknown emails.
 */
export function getDummyPasswordHash() {
  dummyHash ??= bcrypt.hashSync(crypto.randomUUID(), 10);
  return dummyHash;
}
