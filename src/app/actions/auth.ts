"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, endSession, requireUser } from "@/lib/auth";
import { hashPassword, normalizeUsername, validPassword, verifyPassword } from "@/lib/password";

export async function login(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const password = formData.get("password");
  if (!username || !validPassword(password)) redirect("/login?error=credentials");
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    await hashPassword("invalid-login-attempt");
    redirect("/login?error=credentials");
  }
  if (user.disabled || (user.lockedUntil && user.lockedUntil > new Date())) redirect("/login?error=credentials");
  if (!(await verifyPassword(password, user.passwordHash))) {
    // shortcut: Throttling is per username; add network-level limits if login traffic grows.
    const attempt = await prisma.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } } });
    if (attempt.failedLogins >= 5) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } });
    }
    redirect("/login?error=credentials");
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/account/password" : "/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser(true);
  const oldPassword = formData.get("oldPassword");
  const newPassword = formData.get("newPassword");
  if (typeof oldPassword !== "string" || !validPassword(newPassword) || newPassword !== formData.get("confirmPassword") ||
      !(await verifyPassword(oldPassword, user.passwordHash))) {
    redirect("/account/password?error=invalid");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  redirect("/account?status=password");
}

async function requireOwner() {
  const user = await requireUser();
  if (!user.isOwner) redirect("/");
  return user;
}

export async function createMember(formData: FormData) {
  await requireOwner();
  const username = normalizeUsername(formData.get("username"));
  const password = formData.get("password");
  if (!username || !validPassword(password)) redirect("/account/users?error=invalid");
  try {
    await prisma.user.create({ data: { username, passwordHash: await hashPassword(password) } });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      redirect("/account/users?error=duplicate");
    }
    throw error;
  }
  redirect("/account/users?status=created");
}

export async function resetMemberPassword(id: number, formData: FormData) {
  await requireOwner();
  const password = formData.get("password");
  if (!validPassword(password)) redirect("/account/users?error=invalid");
  const changed = await prisma.user.updateMany({
    where: { id, isOwner: false },
    data: { passwordHash: await hashPassword(password), mustChangePassword: true, failedLogins: 0, lockedUntil: null },
  });
  if (changed.count !== 1) redirect("/account/users?error=missing");
  await prisma.session.deleteMany({ where: { userId: id } });
  redirect("/account/users?status=reset");
}

export async function setMemberDisabled(id: number, disabled: boolean) {
  await requireOwner();
  const changed = await prisma.user.updateMany({ where: { id, isOwner: false }, data: { disabled } });
  if (changed.count !== 1) redirect("/account/users?error=missing");
  if (disabled) await prisma.session.deleteMany({ where: { userId: id } });
  redirect(`/account/users?status=${disabled ? "disabled" : "enabled"}`);
}
