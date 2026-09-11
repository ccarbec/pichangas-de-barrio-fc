"use server";

import { redirect } from "next/navigation";
import { cerrarSesion } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { normalizarTelefono } from "@/lib/telefono";
import { generarHash } from "@/lib/auth-crypto";

export async function logout() {
  await cerrarSesion();
  redirect("/login");
}

export async function restablecerPassword(formData: FormData) {
  const celular = normalizarTelefono(String(formData.get("celular") ?? ""));
  const nuevaPassword = String(formData.get("nuevaPassword") ?? "");

  if (!nuevaPassword) throw new Error("Escribe una contraseña nueva.");

  const usuario = await prisma.usuario.findFirst({ where: { telefono: celular, estado: "activo" } });
  if (!usuario) throw new Error("No encontramos ninguna cuenta activa con ese celular.");

  const { hash, salt } = generarHash(nuevaPassword);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash: hash, salt },
  });
}
