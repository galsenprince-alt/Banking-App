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
        <p className="text-[13px] font-medium opacity-80 mb-0.5 leading-5">
          Welcome back, {userName}
        </p>
        <p className="text-12 opacity-70 mb-2 sm:mb-3">Total balance</p>
        <div className="flex items-baseline gap-3 mb-3 sm:mb-4 font-space-grotesk">
          <span className="text-[32px] sm:text-[40px] md:text-[48px] font-semibold tracking-tight leading-none">
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
