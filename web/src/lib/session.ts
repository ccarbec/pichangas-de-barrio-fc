import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE = "pichangas_sesion";
const COOKIE_VISTA = "pichangas_vista_jugador";
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

  // Un admin puede "verse como jugador" (útil si también juega): esto
  // reemplaza el rol efectivo en TODA la app (pantallas y Server Actions,
  // vía requireAdmin) mientras dure la preferencia — no es solo visual.
  // La cookie nunca puede subir a nadie a admin: solo aplica si el rol
  // real en la base YA es admin.
  const esAdminReal = sesion.usuario.rol === "admin";
  const vistaJugador = esAdminReal && cookieStore.get(COOKIE_VISTA)?.value === "1";

  return {
    ...sesion.usuario,
    rol: vistaJugador ? "jugador" : sesion.usuario.rol,
    esAdminReal,
    vistaJugador,
  };
}

export async function cambiarVistaJugador(comoJugador: boolean) {
  const cookieStore = await cookies();
  if (comoJugador) {
    cookieStore.set(COOKIE_VISTA, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete(COOKIE_VISTA);
  }
}

export async function cerrarSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (token) {
    await prisma.sesion.deleteMany({ where: { token } });
    cookieStore.delete(COOKIE);
  }
  cookieStore.delete(COOKIE_VISTA);
}
