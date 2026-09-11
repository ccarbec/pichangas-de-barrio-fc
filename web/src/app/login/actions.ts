"use server";

import { redirect } from "next/navigation";
import { verificarCredenciales } from "@/lib/usuarios";
import { iniciarSesion } from "@/lib/session";

export async function login(formData: FormData) {
  const celular = String(formData.get("celular") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const usuario = await verificarCredenciales(celular, password);
  if (!usuario) {
    redirect("/login?error=1");
  }

  await iniciarSesion(usuario.id);
  redirect("/dashboard");
}
