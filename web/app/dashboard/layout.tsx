import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { TopNav } from "../components/TopNav";

export default async function DashboardLayout(props: LayoutProps<"/dashboard">) {
  const cookieStore = await cookies();
  if (!cookieStore.get("pichangas_demo_session")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopNav nombre="Marco (demo)" />
        <main className="flex-1 p-6">{props.children}</main>
      </div>
    </div>
  );
}
