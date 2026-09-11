"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireLogin } from "@/lib/require-auth";
import { generarHash, verificarPassword } from "@/lib/auth-crypto";
import { normalizarTelefono } from "@/lib/telefono";

export async function crearJugadorManual(formData: FormData) {
  await requireAdmin();

  const telefono = normalizarTelefono(String(formData.get("telefono") ?? ""));
  const existente = await prisma.usuario.findUnique({ where: { telefono } });
  if (existente) throw new Error("Ya existe una cuenta con ese celular.");

  const { hash, salt } = generarHash(String(formData.get("password") ?? ""));

  const usuario = await prisma.usuario.create({
    data: {
      nombre: String(formData.get("nombres") ?? "").trim(),
      telefono,
      passwordHash: hash,
      salt,
      rol: "jugador",
    },
  });
  await prisma.jugador.create({
    data: {
      usuarioId: usuario.id,
      apellidos: String(formData.get("apellidos") ?? "").trim(),
      apodo: String(formData.get("apodo") ?? "").trim() || null,
      posicion: String(formData.get("posicion") ?? "") || null,
      equipoHincha: String(formData.get("equipoHincha") ?? "").trim(),
      camiseta: String(formData.get("camiseta") ?? "").trim(),
    },
  });

  revalidatePath("/dashboard/miembros");
}

export async function actualizarJugador(formData: FormData) {
  await requireAdmin();

  const jugadorId = Number(formData.get("jugadorId"));
  const jugador = await prisma.jugador.findUniqueOrThrow({ where: { id: jugadorId } });

  await prisma.jugador.update({
    where: { id: jugadorId },
    data: {
      apellidos: String(formData.get("apellidos") ?? "").trim(),
      apodo: String(formData.get("apodo") ?? "").trim() || null,
      posicion: String(formData.get("posicion") ?? "") || null,
      equipoHincha: String(formData.get("equipoHincha") ?? "").trim(),
      camiseta: String(formData.get("camiseta") ?? "").trim(),
    },
  });

  const nombres = String(formData.get("nombres") ?? "").trim();
  const rol = String(formData.get("rol") ?? "jugador");
  const nuevaPassword = String(formData.get("nuevaPassword") ?? "");

  const dataUsuario: Record<string, unknown> = {};
  if (nombres) dataUsuario.nombre = nombres;
  if (rol === "admin" || rol === "jugador") dataUsuario.rol = rol;
  if (nuevaPassword) {
    const { hash, salt } = generarHash(nuevaPassword);
    dataUsuario.passwordHash = hash;
    dataUsuario.salt = salt;
  }
  if (Object.keys(dataUsuario).length > 0) {
    await prisma.usuario.update({ where: { id: jugador.usuarioId }, data: dataUsuario });
  }

  revalidatePath("/dashboard/miembros");
}

export async function cambiarEstadoJugador(jugadorId: number, activar: boolean) {
  await requireAdmin();
  const jugador = await prisma.jugador.findUniqueOrThrow({ where: { id: jugadorId } });
  const estado = activar ? "activo" : "inactivo";
  await prisma.$transaction([
    prisma.jugador.update({ where: { id: jugadorId }, data: { estado } }),
    prisma.usuario.update({ where: { id: jugador.usuarioId }, data: { estado } }),
  ]);
  revalidatePath("/dashboard/miembros");
}

export async function eliminarJugador(jugadorId: number) {
  await requireAdmin();
  const tieneHistorial = await prisma.inscripcion.findFirst({ where: { jugadorId } });
  if (tieneHistorial) {
    throw new Error("Este jugador ya tiene partidos registrados — inactívalo en vez de eliminarlo.");
  }
  const jugador = await prisma.jugador.findUniqueOrThrow({ where: { id: jugadorId } });
  await prisma.$transaction([
    prisma.jugador.delete({ where: { id: jugadorId } }),
    prisma.sesion.deleteMany({ where: { usuarioId: jugador.usuarioId } }),
    prisma.usuario.delete({ where: { id: jugador.usuarioId } }),
  ]);
  revalidatePath("/dashboard/miembros");
}

export async function subirFotoJugador(formData: FormData) {
  const usuario = await requireLogin();
  const jugadorId = Number(formData.get("jugadorId"));
  if (usuario.rol !== "admin") {
    const propio = await prisma.jugador.findUnique({ where: { usuarioId: usuario.id } });
    if (!propio || propio.id !== jugadorId) throw new Error("No autorizado.");
  }
  const archivo = formData.get("foto") as File | null;
  if (!archivo || archivo.size === 0) throw new Error("Selecciona una foto.");
  if (archivo.size > 5 * 1024 * 1024) throw new Error("La foto pesa más de 5MB.");

  const bytes = Buffer.from(await archivo.arrayBuffer());
  await prisma.jugador.update({
    where: { id: jugadorId },
    data: { fotoImg: bytes, fotoMime: archivo.type },
  });
  revalidatePath("/dashboard/miembros");
  revalidatePath("/dashboard/perfil");
}

export async function actualizarMiPerfil(formData: FormData) {
  const usuario = await requireLogin();
  const jugador = await prisma.jugador.findUnique({ where: { usuarioId: usuario.id } });
  if (!jugador) throw new Error("No tienes perfil de jugador.");

  const nombres = String(formData.get("nombres") ?? "").trim();

  await prisma.$transaction([
    prisma.jugador.update({
      where: { id: jugador.id },
      data: {
        apellidos: String(formData.get("apellidos") ?? "").trim(),
        apodo: String(formData.get("apodo") ?? "").trim() || null,
        posicion: String(formData.get("posicion") ?? "") || null,
        equipoHincha: String(formData.get("equipoHincha") ?? "").trim(),
        camiseta: String(formData.get("camiseta") ?? "").trim(),
        resena: String(formData.get("resena") ?? "").trim(),
      },
    }),
    ...(nombres ? [prisma.usuario.update({ where: { id: usuario.id }, data: { nombre: nombres } })] : []),
  ]);

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/miembros");
}

export async function cambiarMiPassword(formData: FormData) {
  const usuario = await requireLogin();
  const passwordActual = String(formData.get("passwordActual") ?? "");
  const passwordNueva = String(formData.get("passwordNueva") ?? "");

  if (!passwordNueva) throw new Error("Escribe una contraseña nueva.");

  const usuarioCompleto = await prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id } });
  if (!verificarPassword(passwordActual, usuarioCompleto.passwordHash, usuarioCompleto.salt)) {
    throw new Error("Tu contraseña actual no es correcta.");
  }

  const { hash, salt } = generarHash(passwordNueva);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash: hash, salt } });
}

export async function activarMiPerfil(apodo: string, posicion: string) {
  const usuario = await requireLogin();
  const existente = await prisma.jugador.findUnique({ where: { usuarioId: usuario.id } });
  if (existente) return;
  await prisma.jugador.create({
    data: { usuarioId: usuario.id, apodo: apodo.trim() || null, posicion: posicion || null },
  });
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
}
