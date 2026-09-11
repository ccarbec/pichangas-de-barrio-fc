import { prisma } from "./prisma";
import { normalizarTelefono } from "./telefono";
import { verificarPassword } from "./auth-crypto";

export async function obtenerUsuarioPorTelefono(telefono: string) {
  return prisma.usuario.findFirst({
    where: { telefono: normalizarTelefono(telefono), estado: "activo" },
  });
}

export async function verificarCredenciales(telefono: string, password: string) {
  const usuario = await obtenerUsuarioPorTelefono(telefono);
  if (!usuario) return null;
  if (!verificarPassword(password, usuario.passwordHash, usuario.salt)) return null;
  return usuario;
}
