"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Prueba de diseño únicamente — sin base de datos todavía.
// Usuario de prueba: 999999999 / demo123
const DEMO_CELULAR = "999999999";
const DEMO_PASSWORD = "demo123";

export async function loginDemo(formData: FormData) {
  const celular = String(formData.get("celular") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (celular !== DEMO_CELULAR || password !== DEMO_PASSWORD) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set("pichangas_demo_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/dashboard");
}
