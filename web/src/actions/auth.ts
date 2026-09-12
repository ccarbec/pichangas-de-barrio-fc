"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cambiarVistaJugador, cerrarSesion, iniciarSesion, obtenerUsuarioActual } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { normalizarTelefono } from "@/lib/telefono";
import { generarHash } from "@/lib/auth-crypto";

export async function logout() {
  await cerrarSesion();
  redirect("/login");
}

// Solo un admin de verdad puede prender/apagar esto — la cookie en sí ya
// no puede subir a nadie a admin (ver obtenerUsuarioActual), pero además
// se valida acá para no depender solo de eso.
export async function alternarVistaJugador(comoJugador: boolean) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.esAdminReal) return;
  await cambiarVistaJugador(comoJugador);
  revalidatePath("/dashboard");
}

export async function registrarJugador(formData: FormData): Promise<{ error?: string }> {
  const nombres = String(formData.get("nombres") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const celular = normalizarTelefono(String(formData.get("celular") ?? ""));
  const password = String(formData.get("password") ?? "");
  const posicion = String(formData.get("posicion") ?? "").trim();

  if (!nombres) return { error: "Escribe tu nombre." };
  if (celular.length !== 11) return { error: "Escribe un celular válido (9 dígitos)." };
  if (!password) return { error: "Escribe una contraseña." };

  const existente = await prisma.usuario.findUnique({ where: { telefono: celular } });
  if (existente) return { error: "Ya existe una cuenta con ese celular. Si es tuya, usa \"¿Olvidaste tu contraseña?\"." };

  const { hash, salt } = generarHash(password);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: nombres,
      telefono: celular,
      passwordHash: hash,
      salt,
      rol: "jugador",
    },
  });
  await prisma.jugador.create({
    data: {
      usuarioId: usuario.id,
      apellidos,
      posicion: posicion || null,
    },
  });

  await iniciarSesion(usuario.id);
  redirect("/dashboard");
}
