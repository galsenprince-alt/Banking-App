"use client";

type SpendingItem = { label: string; amount: number; color: string };

const CATEGORY_COLORS: Record<string, string> = {
  "Food and Drink": "var(--accent)",
  Travel: "var(--violet)",
  Shopping: "var(--emerald)",
  Transfer: "var(--sky)",
  Payment: "var(--rose)",
  Transportation: "var(--amber)",
  Entertainment: "var(--violet)",
  "Bank Fees": "var(--rose)",
};

const DEFAULT_COLOR = "var(--text-muted)";

function buildSpendingItems(transactions: any[]): SpendingItem[] {
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const cat = tx.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(tx.amount);
  }

  const sorted = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const usedColors = new Set<string>();
  return sorted.map(([label, amount]) => {
    let color = CATEGORY_COLORS[label] || DEFAULT_COLOR;
    if (usedColors.has(color)) color = DEFAULT_COLOR;
    usedColors.add(color);
    return { label, amount: Math.round(amount * 100) / 100, color };
  });
}

const SpendingBreakdown = ({
  transactions = [],
}: {
  transactions?: any[];
}) => {
  const items = buildSpendingItems(transactions);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const segments = items.reduce<{ item: SpendingItem; length: number; offset: number }[]>(
    (acc, item) => {
      const length = total > 0 ? (item.amount / total) * circumference : 0;
      const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset - acc[acc.length - 1].length;
      return [...acc, { item, length, offset }];
    },
    []
  );

  const formatAmount = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div className="surface p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-title">Spending</h3>
        <span className="card-subtitle">This month</span>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="card-subtitle">No spending data yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="var(--bg-surface-2)"
              strokeWidth="14"
            />
            {segments.map(({ item, length, offset }) => {
              const dasharray = `${length} ${circumference}`;
              return (
                <circle
                  key={item.label}
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="14"
                  strokeDasharray={dasharray}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 48 48)"
                />
              );
            })}
            <text
              x="48"
              y="46"
              textAnchor="middle"
              className="text-12"
              fill="var(--text-muted)"
            >
              Total
            </text>
            <text
              x="48"
              y="60"
              textAnchor="middle"
              className="font-space-grotesk font-semibold"
              fill="var(--text-strong)"
              fontSize="14"
            >
              {formatAmount(total)}
            </text>
          </svg>

          <div className="flex-1 flex flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: item.color }}
                />
                <span
                  className="text-12 flex-1"
                  style={{ color: "var(--text-soft)" }}
                >
                  {item.label}
                </span>
                <span
                  className="text-12 font-semibold"
                  style={{ color: "var(--text-strong)" }}
                >
                  {formatAmount(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingBreakdown;
