export function nombreCompleto(p: { apellidos?: string | null; apodo?: string | null; usuario?: { nombre: string } }) {
  const apellidos = (p.apellidos ?? "").trim();
  const nombre = p.usuario?.nombre?.trim() ?? "";
  let base = apellidos ? `${apellidos}, ${nombre}` : nombre;
  if (p.apodo) base += ` (${p.apodo})`;
  return base;
}

export function esArquero(posicion?: string | null): boolean {
  if (!posicion) return false;
  const p = posicion.toLowerCase();
  return p.includes("arquero") || p.includes("portero");
}

export function emojiPosicion(posicion?: string | null) {
  switch (posicion) {
    case "Arquero":
      return "🧤";
    case "Defensa":
      return "🛡️";
    case "Mediocampo":
      return "🎯";
    case "Delantero":
      return "⚽";
    default:
      return "🏃";
  }
}

export const ETIQUETA_INSCRIPCION: Record<string, { texto: string; variant: "active" | "warning" | "neutral" }> = {
  confirmado: { texto: "Confirmado", variant: "active" },
  lista_espera: { texto: "Lista de espera", variant: "warning" },
  cancelado: { texto: "Cancelado", variant: "neutral" },
};

export const ETIQUETA_PAGO: Record<string, { texto: string; variant: "active" | "warning" | "danger" | "neutral" }> = {
  sin_pago: { texto: "Sin pago", variant: "neutral" },
  pendiente: { texto: "Pendiente de verificar", variant: "warning" },
  verificado: { texto: "Pago verificado", variant: "active" },
  rechazado: { texto: "Rechazado", variant: "danger" },
};

export const POSICIONES_SUGERIDAS = ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"];

export const ETIQUETAS_ASISTENCIA = [
  { value: "", label: "Sin marcar" },
  { value: "llego", label: "✅ Llegó" },
  { value: "tardanza", label: "⏰ Tardanza (multa)" },
  { value: "no_llego", label: "❌ No llegó (multa)" },
];
