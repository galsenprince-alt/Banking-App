"use client";

import { TrendingUp } from "lucide-react";
import CountUp from "react-countup";

const HeroBalance = ({
  userName,
  totalBalance,
  trend = 2.4,
}: {
  userName: string;
  totalBalance: number;
  trend?: number;
}) => {
  return (
    <div className="hero-balance">
      <div className="hero-blob" />
      <div className="hero-blob-2" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <p className="text-sm text-white/80 mb-3">
          Welcome back, {userName} 👋
        </p>
        <div className="flex items-baseline gap-1 mb-1 font-space-grotesk">
          <span className="text-4xl font-bold tracking-tight leading-none">
            $
            <CountUp
              decimal="."
              decimals={2}
              duration={1.2}
              end={totalBalance}
            />
          </span>
        </div>
        <p className="text-xs text-white/60 mb-4">Total balance</p>
        <div className="trend-pill">
          <TrendingUp size={12} />
          <span>+{trend}% this month</span>
        </div>
      </div>
    </div>
  );
};

export default HeroBalance;
