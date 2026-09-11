import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

// Debe producir EXACTAMENTE el mismo hash que utils/auth.py (PBKDF2-HMAC-
// SHA256, 100k iteraciones, salt de 16 bytes en hex) para que las
// contraseñas de los jugadores reales sigan funcionando sin resetear nada.
const ITERACIONES = 100_000;
const LARGO_LLAVE = 32;

export function generarHash(password: string, saltHex?: string) {
  const salt = saltHex ?? randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, Buffer.from(salt, "hex"), ITERACIONES, LARGO_LLAVE, "sha256").toString(
    "hex"
  );
  return { hash, salt };
}

export function verificarPassword(password: string, hashGuardado: string, salt: string): boolean {
  const { hash } = generarHash(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(hashGuardado, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
