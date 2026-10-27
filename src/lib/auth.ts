import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const cookieName = process.env.NODE_ENV === "production" ? "__Host-odecty_session" : "odecty_session";
const sessionAge = 7 * 24 * 60 * 60;
const idleAge = 24 * 60 * 60 * 1000;

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const now = new Date();
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= now || session.lastUsedAt.getTime() + idleAge <= now.getTime() || session.user.disabled) return null;
  if (session.lastUsedAt.getTime() + 15 * 60 * 1000 < now.getTime()) {
    await prisma.session.update({ where: { tokenHash: session.tokenHash }, data: { lastUsedAt: now } });
  }
  return session.user;
}

export async function requireUser(allowPasswordChange = false) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !allowPasswordChange) redirect("/account/password");
  return user;
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { tokenHash: tokenHash(token), userId, expiresAt: new Date(Date.now() + sessionAge * 1000) },
  });
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionAge,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  store.delete(cookieName);
}
