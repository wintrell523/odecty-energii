import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const params = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, params, (error, key) => error ? reject(error) : resolve(key));
  });
}

export function validPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 12 && password.length <= 128;
}

export function normalizeUsername(username: unknown): string | null {
  if (typeof username !== "string") return null;
  const value = username.trim().toLowerCase();
  return /^[a-z0-9_-]{3,32}$/.test(value) ? value : null;
}

export async function hashPassword(password: string): Promise<string> {
  if (!validPassword(password)) throw new Error("Password must have 12–128 characters");
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(password, salt);
  return `scrypt$${params.N}$${params.r}$${params.p}$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || n !== String(params.N) || r !== String(params.r) || p !== String(params.p) ||
      !/^[0-9a-f]{32}$/.test(salt ?? "") || !/^[0-9a-f]{128}$/.test(expected ?? "")) return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}
