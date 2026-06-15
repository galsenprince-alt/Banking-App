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
    <main className="flex h-screen w-full font-dm-sans">
      {/* Desktop sidebar */}
      <Sidebar user={loggedIn} />

      <div className="flex size-full flex-col">
        {/* Top header — visible on ALL screen sizes */}
        <TopHeader user={loggedIn} />

        {children}
      </div>
    </main>
  );
}
