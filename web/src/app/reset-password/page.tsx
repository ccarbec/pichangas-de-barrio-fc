import Link from "next/link";
import { normalizarTelefono } from "@/lib/telefono";

// Celular del admin que atiende los restablecimientos de contraseña —
// no necesariamente el mismo que el de Yape (Configuración > Yape), que
// puede ser de otra persona encargada de cobros.
const TELEFONO_ADMIN = normalizarTelefono("964310391");

export default function ResetPasswordPage() {
  const mensaje = encodeURIComponent("Hola, se me olvidó mi contraseña de la app de Pichangas de Barrio FC. ¿Me ayudas a restablecerla?");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="text-4xl">🔑</span>
          <h1 className="text-lg font-bold">Recuperar contraseña</h1>
        </div>

        <p className="mb-6 text-sm text-[var(--muted)]">
          Por seguridad, el restablecimiento de contraseña ya no es automático — escríbele al admin del club por
          WhatsApp y te la restablece él mismo.
        </p>

        <a
          href={`https://wa.me/${TELEFONO_ADMIN}?text=${mensaje}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
        >
          💬 Escribir al admin por WhatsApp
        </a>

        <Link href="/login" className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
