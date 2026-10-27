import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { login } from "@/app/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await currentUser();
  if (user) redirect(user.mustChangePassword ? "/account/password" : "/");
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="display text-3xl">Přihlášení</h1>
      <form action={login} className="card space-y-4">
        <label className="block space-y-1">Uživatelské jméno
          <input className="input w-full" name="username" autoComplete="username" required />
        </label>
        <label className="block space-y-1">Heslo
          <input className="input w-full" name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">Nesprávné jméno nebo heslo. Po více pokusech zkuste přihlášení za 15 minut.</p>}
        <button className="btn btn-primary" type="submit">Přihlásit se</button>
      </form>
    </div>
  );
}
