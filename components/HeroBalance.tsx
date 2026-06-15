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
      <div className="relative z-10">
        <p className="text-12 opacity-85 mb-1">Welcome back, {userName}</p>
        <p className="text-14 opacity-90 mb-2">Total balance</p>
        <div className="flex items-baseline gap-1 mb-3 font-space-grotesk">
          <span className="text-36 md:text-[44px] font-semibold tracking-tight leading-none">
            $
            <CountUp
              decimal="."
              decimals={2}
              duration={1.2}
              end={totalBalance}
            />
          </span>
        </div>
        <div className="trend-pill">
          <TrendingUp size={12} />
          <span>+{trend}% this month</span>
        </div>
      </div>
    </div>
  );
};

export default HeroBalance;
