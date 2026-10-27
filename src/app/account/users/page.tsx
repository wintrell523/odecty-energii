import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createMember, resetMemberPassword, setMemberDisabled } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; status?: string }> }) {
  const owner = await requireUser();
  if (!owner.isOwner) redirect("/");
  const users = await prisma.user.findMany({ where: { isOwner: false }, orderBy: { username: "asc" } });
  const { error, status } = await searchParams;
  const errors: Record<string, string> = {
    invalid: "Jméno musí mít 3–32 znaků (a–z, čísla, _ nebo -). Heslo musí mít 12–128 znaků.",
    duplicate: "Uživatelské jméno už existuje.",
    missing: "Účet nebyl nalezen.",
  };
  return <div className="space-y-6">
    <h1 className="display text-3xl">Správa účtů</h1>
    {error && <p role="alert" className="text-red-700">{errors[error] ?? "Akce se nezdařila."}</p>}
    {status && <p role="status">Změna byla uložena.</p>}
    <form action={createMember} className="card space-y-4 max-w-lg">
      <h2 className="display text-xl">Nový účet</h2>
      <label className="block space-y-1">Uživatelské jméno
        <input className="input w-full" name="username" autoComplete="off" minLength={3} maxLength={32} required />
      </label>
      <label className="block space-y-1">Dočasné heslo (12–128 znaků)
        <input className="input w-full" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      <button className="btn btn-primary" type="submit">Vytvořit účet</button>
    </form>
    <div className="space-y-3">
      {users.map((user) => <section key={user.id} className="card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="display text-xl">{user.username}</h2>
          <span>{user.disabled ? "Přístup vypnut" : "Aktivní"}</span>
        </div>
        <form action={resetMemberPassword.bind(null, user.id)} className="flex flex-wrap items-end gap-2">
          <label className="space-y-1">Nové dočasné heslo
            <input className="input block" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
          </label>
          <button className="btn btn-secondary" type="submit">Resetovat heslo</button>
        </form>
        <form action={setMemberDisabled.bind(null, user.id, !user.disabled)}>
          <button className="btn btn-secondary" type="submit">{user.disabled ? "Obnovit přístup" : "Vypnout přístup"}</button>
        </form>
      </section>)}
    </div>
  </div>;
}
