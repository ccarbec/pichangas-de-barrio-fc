import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/session";
import { Sidebar } from "../components/Sidebar";
import { TopNav } from "../components/TopNav";

export default async function DashboardLayout(props: LayoutProps<"/dashboard">) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopNav nombre={usuario.nombre} />
        <main className="flex-1 p-6">{props.children}</main>
      </div>
    </div>
  );
}
