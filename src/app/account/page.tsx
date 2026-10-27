import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const { status } = await searchParams;
  return <div className="space-y-6">
    <h1 className="display text-3xl">Účet</h1>
    <p>Přihlášen jako <strong>{user.username}</strong>.</p>
    {status === "password" && <p role="status">Heslo bylo změněno.</p>}
    <div className="flex flex-wrap gap-3">
      <Link className="btn btn-secondary" href="/account/password">Změnit heslo</Link>
      {user.isOwner && <Link className="btn btn-secondary" href="/account/users">Správa účtů</Link>}
      <form action={logout}><button className="btn btn-secondary" type="submit">Odhlásit se</button></form>
    </div>
  </div>;
}
