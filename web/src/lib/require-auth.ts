import { obtenerUsuarioActual } from "./session";

export async function requireAdmin() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") {
    throw new Error("No autorizado — se requiere ser admin.");
  }
  return usuario;
}

export async function requireLogin() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    throw new Error("No autorizado — inicia sesión.");
  }
  return usuario;
}
