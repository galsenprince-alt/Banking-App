export const dynamic = "force-dynamic";

import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) redirect("/sign-in");

  return (
    <main className="flex h-screen w-full font-dm-sans" style={{ background: "var(--bg-page)" }}>
      <Sidebar user={loggedIn} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeader user={loggedIn} />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </main>
  );
}
