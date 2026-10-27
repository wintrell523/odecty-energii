import { requireUser } from "@/lib/auth";
import { changePassword } from "@/app/actions/auth";

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser(true);
  const { error } = await searchParams;
  return <div className="mx-auto max-w-md space-y-6">
    <h1 className="display text-3xl">{user.mustChangePassword ? "Nastavit vlastní heslo" : "Změnit heslo"}</h1>
    <form action={changePassword} className="card space-y-4">
      <label className="block space-y-1">Současné heslo
        <input className="input w-full" name="oldPassword" type="password" autoComplete="current-password" required />
      </label>
      <label className="block space-y-1">Nové heslo (12–128 znaků)
        <input className="input w-full" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      <label className="block space-y-1">Potvrdit nové heslo
        <input className="input w-full" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      {error && <p className="text-sm text-red-700" role="alert">Zkontrolujte současné heslo a shodu nového hesla.</p>}
      <button className="btn btn-primary" type="submit">Uložit heslo</button>
    </form>
  </div>;
}
