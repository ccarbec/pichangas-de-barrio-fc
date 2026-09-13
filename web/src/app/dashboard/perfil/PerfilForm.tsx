"use client";

import { useState, useTransition, useRef } from "react";
import { actualizarMiPerfil, subirFotoJugador, cambiarMiPassword } from "@/actions/jugadores";
import { POSICIONES_SUGERIDAS } from "@/lib/estilos";
import { Toast } from "../../components/Toast";

type Jugador = {
  id: number;
  nombre: string;
  apellidos: string;
  apodo: string | null;
  posicion: string | null;
  dni: string | null;
  equipoHincha: string;
  camiseta: string;
  resena: string;
  foto: string | null;
};

export function PerfilForm({ jugador }: { jugador: Jugador }) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<unknown>, mensajeExito: string) {
    setError(null);
    startTransition(async () => {
      try {
        const resultado = await fn();
        if (resultado && typeof resultado === "object" && "error" in resultado && resultado.error) {
          setError(String(resultado.error));
        } else {
          setToast(mensajeExito);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-3">
          {jugador.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={jugador.foto} alt="" className="h-40 w-40 rounded-xl object-cover" />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-[var(--surface)] text-xs text-[var(--muted)]">
              Sin foto
            </div>
          )}
          <form
            action={(fd) => run(() => subirFotoJugador(fd), "Foto actualizada.")}
            className="flex flex-col items-center gap-2"
          >
            <input type="hidden" name="jugadorId" value={jugador.id} />
            <input type="file" name="foto" accept="image/*" className="text-xs" />
            <button type="submit" disabled={pending} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs transition-colors hover:border-[var(--accent)]">
              Guardar foto
            </button>
          </form>
        </div>

        <form
          action={(fd) => run(() => actualizarMiPerfil(fd), "Perfil actualizado.")}
          className="flex flex-1 flex-col gap-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Nombres</label>
              <input name="nombres" defaultValue={jugador.nombre} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Apellidos</label>
              <input name="apellidos" defaultValue={jugador.apellidos} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Apodo</label>
            <input name="apodo" defaultValue={jugador.apodo ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Posición</label>
            <select name="posicion" defaultValue={jugador.posicion ?? ""} className={inputClass}>
              <option value="">Sin definir</option>
              {POSICIONES_SUGERIDAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">DNI</label>
            <input name="dni" maxLength={15} defaultValue={jugador.dni ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Hincha de qué equipo</label>
            <input name="equipoHincha" defaultValue={jugador.equipoHincha} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Camiseta que usas</label>
            <input name="camiseta" defaultValue={jugador.camiseta} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Reseña — cuéntanos algo sobre ti</label>
            <textarea
              name="resena"
              defaultValue={jugador.resena}
              rows={3}
              placeholder="Ej: Juego hace 10 años, me gusta la pizza post-partido y nunca fallo un penal 😄"
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
          >
            💾 Guardar cambios
          </button>
        </form>
      </div>

      <CambiarPasswordForm />
    </div>
  );
}

function CambiarPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const resultado = await cambiarMiPassword(fd);
          if (resultado?.error) {
            setError(resultado.error);
          } else {
            setToast("Contraseña actualizada.");
            formRef.current?.reset();
          }
        });
      }}
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:max-w-md"
    >
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">🔒 Cambiar contraseña</p>
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Contraseña actual</label>
        <input name="passwordActual" type="password" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Nueva contraseña</label>
        <input name="passwordNueva" type="password" required className={inputClass} />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
      >
        Actualizar contraseña
      </button>
    </form>
  );
}

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";
