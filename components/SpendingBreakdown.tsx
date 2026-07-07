"use client";

type SpendingItem = { label: string; amount: number; color: string };

const SpendingBreakdown = ({
  items = [
    { label: "Food and Drink", amount: 420, color: "var(--accent)" },
    { label: "Travel", amount: 280, color: "var(--violet)" },
    { label: "Shopping", amount: 190, color: "var(--emerald)" },
  ],
}: {
  items?: SpendingItem[];
}) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const segments = items.reduce<{ item: SpendingItem; length: number; offset: number }[]>(
    (acc, item) => {
      const length = (item.amount / total) * circumference;
      const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset - acc[acc.length - 1].length;
      return [...acc, { item, length, offset }];
    },
    []
  );

  return (
    <div className="surface p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-title">Spending</h3>
        <span className="card-subtitle">This month</span>
      </div>

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
            ${total}
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
                ${item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpendingBreakdown;
