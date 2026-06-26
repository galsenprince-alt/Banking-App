import { Bell, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import MobileNav from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

const TopHeader = ({ user }: { user: User }) => {
  return (
    <header
      className="flex h-14 w-full items-center justify-between border-b px-5 sm:px-8 shrink-0"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Logo on small screens / breadcrumb area on xl */}
      <Link
        href="/"
        className="flex items-center gap-2 xl:opacity-0 xl:pointer-events-none"
        aria-hidden={true}
      >
        <Image
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="M$F Banking logo"
          priority
        />
        <span
          className="text-[16px] font-bold tracking-tight font-space-grotesk"
          style={{ color: "var(--text-strong)" }}
        >
          M<span style={{ color: "var(--accent)" }}>$</span>F Banking
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Search"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
          style={{ color: "var(--text-muted)" }}
        >
          <Search size={16} />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
          style={{ color: "var(--text-muted)" }}
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
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
