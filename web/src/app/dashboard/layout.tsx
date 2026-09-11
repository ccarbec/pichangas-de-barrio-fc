import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/session";
import { AppShell } from "../components/AppShell";

export default async function DashboardLayout(props: LayoutProps<"/dashboard">) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  return (
    <AppShell nombre={usuario.nombre} esAdmin={usuario.rol === "admin"}>
      {props.children}
    </AppShell>
  );
}
