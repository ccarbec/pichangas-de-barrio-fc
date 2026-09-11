import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE = "pichangas_sesion";
const DIAS_DURACION_SESION = 30;

export async function iniciarSesion(usuarioId: number) {
  const token = randomBytes(32).toString("base64url");
  await prisma.sesion.create({
    data: { token, usuarioId, creadoEn: new Date().toISOString() },
  });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * DIAS_DURACION_SESION,
  });
}

export async function obtenerUsuarioActual() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;

  const sesion = await prisma.sesion.findUnique({
    where: { token },
    include: { usuario: { include: { jugador: true } } },
  });
  if (!sesion || sesion.usuario.estado !== "activo") return null;

  const creado = new Date(sesion.creadoEn).getTime();
  const limiteMs = DIAS_DURACION_SESION * 24 * 60 * 60 * 1000;
  if (Date.now() - creado > limiteMs) return null;

  return sesion.usuario;
}

export async function cerrarSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (token) {
    await prisma.sesion.deleteMany({ where: { token } });
    cookieStore.delete(COOKIE);
  }
}
