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
  if (!posicion) return "🏃";
  const p = posicion.toLowerCase();
  if (esArquero(p)) return "🧤";
  if (p.includes("defensa") || p.includes("lateral") || p.includes("central")) return "🛡️";
  if (p.includes("volante") || p.includes("medio") || p.includes("mediocamp")) return "🎯";
  if (p.includes("delantero") || p.includes("extremo") || p.includes("punta")) return "⚽";
  return "🏃";
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

export function categoriaPosicion(posicion?: string | null): "arquero" | "defensa" | "mediocampo" | "delantero" | "otros" {
  if (esArquero(posicion)) return "arquero";
  const p = (posicion ?? "").toLowerCase();
  if (p.includes("defensa") || p.includes("lateral") || p.includes("central")) return "defensa";
  if (p.includes("volante") || p.includes("medio") || p.includes("mediocamp")) return "mediocampo";
  if (p.includes("delantero") || p.includes("extremo") || p.includes("punta")) return "delantero";
  return "otros";
}

export const ETIQUETAS_ASISTENCIA = [
  { value: "", label: "Sin marcar" },
  { value: "llego", label: "✅ Llegó" },
  { value: "tardanza", label: "⏰ Tardanza (multa)" },
  { value: "no_llego", label: "❌ No llegó (multa)" },
];
