"use client";

import { ArrowDown, ArrowUp, Plus, Receipt } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "Send",
    href: "/payment-transfer",
    Icon: ArrowUp,
    bg: "var(--accent-soft)",
    fg: "var(--accent)",
  },
  {
    label: "Request",
    href: "/payment-transfer",
    Icon: ArrowDown,
    bg: "var(--emerald-soft)",
    fg: "var(--emerald)",
  },
  {
    label: "Top up",
    href: "/my-banks",
    Icon: Plus,
    bg: "var(--violet-soft)",
    fg: "var(--violet)",
  },
  {
    label: "Pay",
    href: "/transaction-history",
    Icon: Receipt,
    bg: "var(--rose-soft)",
    fg: "var(--rose)",
  },
];

const QuickActions = () => {
  return (
    <div className="grid grid-cols-4 gap-3 md:gap-5">
      {actions.map(({ label, href, Icon, bg, fg }) => (
        <Link key={label} href={href} className="quick-action group">
          <div
            className="quick-action-icon group-hover:shadow-md"
            style={{ background: bg, color: fg }}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
          <span className="quick-action-label">{label}</span>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;
