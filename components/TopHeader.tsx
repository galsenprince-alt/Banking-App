import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import MobileNav from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

const TopHeader = ({ user }: { user: User }) => {
  return (
    <header
      className="flex h-16 w-full items-center justify-between border-b px-5 sm:px-8"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Logo — always visible; on xl+ the sidebar already shows it so we dim it */}
      <Link
        href="/"
        className="flex items-center gap-2 xl:opacity-0 xl:pointer-events-none"
        aria-hidden={true}
      >
        <Image
          src="/icons/logo.svg"
          width={38}
          height={38}
          alt="M$F Banking logo"
          priority
        />
        <span
          className="text-[18px] font-bold tracking-tight font-space-grotesk"
          style={{ color: "var(--text-strong)" }}
        >
          M<span style={{ color: "var(--accent)" }}>$</span>F Banking
        </span>
      </Link>

      {/* Right side: notifications + theme toggle + mobile nav */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <ThemeToggle />
        <div className="md:hidden ml-1">
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
