import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { normalizarTelefono } from "@/lib/telefono";

// Sin esto, Next prerendería esta página en el build y congelaría el
// número de Yape de ese momento — necesita leerlo fresco en cada visita,
// porque el admin lo puede cambiar en Configuración en cualquier momento.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const config = await prisma.clubConfig.findUnique({ where: { id: 1 } });
  const telefonoAdmin = config?.telefonoYape ? normalizarTelefono(config.telefonoYape) : null;
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

        {telefonoAdmin ? (
          <a
            href={`https://wa.me/${telefonoAdmin}?text=${mensaje}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 block rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
          >
            💬 Escribir al admin por WhatsApp
          </a>
        ) : (
          <p className="mb-4 text-sm text-[var(--muted)]">Contacta al admin del club por WhatsApp.</p>
        )}

        <Link href="/login" className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
