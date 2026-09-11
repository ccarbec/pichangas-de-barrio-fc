import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const hasError = params?.error === "1";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Pichangas de Barrio FC" className="h-16 w-16 rounded-xl object-cover" />
          <h1 className="text-lg font-bold">PICHANGAS DE BARRIO FC</h1>
          <p className="text-sm text-[var(--muted)]">Panel del club</p>
        </div>

        <form action={login} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Celular</label>
            <input
              name="celular"
              placeholder="999999999"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Contraseña</label>
            <input
              name="password"
              type="password"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          {hasError && (
            <p className="text-sm text-[var(--danger)]">Celular o contraseña incorrectos.</p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
          >
            Ingresar
          </button>
        </form>

        <Link
          href="/reset-password"
          className="mt-4 block text-center text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <Link
          href="/registro"
          className="mt-2 block text-center text-sm font-semibold text-[var(--accent)] transition-opacity hover:opacity-90"
        >
          ¿Nuevo en el club? Crea tu cuenta
        </Link>
      </div>
    </main>
  );
}
