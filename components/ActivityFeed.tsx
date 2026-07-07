"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Coffee,
  Plane,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import Link from "next/link";

const categoryIcon: Record<string, { Icon: typeof Coffee; bg: string; fg: string }> = {
  "Food and Drink": { Icon: Utensils, bg: "var(--rose-soft)", fg: "var(--rose)" },
  Travel: { Icon: Plane, bg: "var(--violet-soft)", fg: "var(--violet)" },
  Shopping: { Icon: ShoppingBag, bg: "var(--accent-soft)", fg: "var(--accent)" },
  Transfer: { Icon: Building2, bg: "var(--emerald-soft)", fg: "var(--emerald)" },
  Payment: { Icon: ArrowUpRight, bg: "var(--rose-soft)", fg: "var(--rose)" },
  Deposit: { Icon: ArrowDownLeft, bg: "var(--emerald-soft)", fg: "var(--emerald)" },
};

const fallback = { Icon: Coffee, bg: "var(--accent-soft)", fg: "var(--accent)" };

type ActivityTransaction = {
  $id?: string;
  id?: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  date?: string;
  $createdAt?: string;
};

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 86400000;
  if (diff < 1) return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 2) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ActivityFeed = ({ transactions = [] }: { transactions?: ActivityTransaction[] }) => {
  const items = transactions.slice(0, 5);

  return (
    <div className="surface p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-title">Recent activity</h3>
        <Link
          href="/transaction-history"
          className="text-12 font-semibold"
          style={{ color: "var(--accent)" }}
        >
          See all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="card-subtitle">No transactions yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((tx) => {
            const meta = categoryIcon[tx.category] ?? fallback;
            const isOutgoing = tx.type === "debit" || tx.amount < 0;
            const amount = Math.abs(tx.amount);
            return (
              <div key={tx.$id || tx.id} className="activity-item">
                <div
                  className="activity-icon"
                  style={{ background: meta.bg, color: meta.fg }}
                >
                  <meta.Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-14 font-semibold truncate"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {tx.name}
                  </p>
                  <p
                    className="text-12"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatDate(tx.date || tx.$createdAt || "")}
                  </p>
                </div>
                <span
                  className="text-14 font-semibold font-space-grotesk"
                  style={{
                    color: isOutgoing ? "var(--rose)" : "var(--emerald)",
                  }}
                >
                  {isOutgoing ? "−" : "+"}${amount.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
