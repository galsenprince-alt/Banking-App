import ActivityFeed from "@/components/ActivityFeed";
import HeroBalance from "@/components/HeroBalance";
import QuickActions from "@/components/QuickActions";
import RightSidebar from "@/components/RightSidebar";
import SpendingBreakdown from "@/components/SpendingBreakdown";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";

const Home = async ({ searchParams }: SearchParamProps) => {
  const { id } = await searchParams;

  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const accounts = await getAccounts({ userId: loggedIn.$id });

  const accountsData = accounts?.data ?? [];
  const totalBalance = accounts?.totalCurrentBalance || 0;

  let transactions: Transaction[] = [];
  if (accountsData.length > 0) {
    const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
    if (appwriteItemId) {
      const account = await getAccount({ appwriteItemId });
      transactions = (account?.transactions || []) as Transaction[];
    }
  }

  return (
    <section className="flex w-full h-full overflow-hidden">
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 pb-8">
          {/* Hero balance card */}
          <HeroBalance
            userName={loggedIn?.firstName || "Guest"}
            totalBalance={totalBalance}
          />

          {/* Quick actions */}
          <div className="surface p-4 sm:p-5">
            <QuickActions />
          </div>

          {/* Two-column grid: spending + activity */}
          <div className="grid gap-5 md:grid-cols-2">
            <SpendingBreakdown />
            <ActivityFeed transactions={transactions} />
          </div>
        </div>
      </div>

      <RightSidebar
        user={loggedIn}
        transactions={transactions}
        banks={accountsData?.slice(0, 2) as (Bank[] & Account[])}
      />
    </section>
  );
};

export default Home;
