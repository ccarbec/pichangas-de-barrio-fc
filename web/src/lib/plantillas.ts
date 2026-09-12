// Mismos valores que usa scripts/recordatorios_auto.py (Python) como "tipo"
// al registrar envíos y elegir variantes — deben coincidir exactamente.
export const TIPOS_PLANTILLA = [
  "recordatorio",
  "pago_pendiente",
  "cupo_liberado",
  "promovido",
] as const;

export type TipoPlantilla = (typeof TIPOS_PLANTILLA)[number];
