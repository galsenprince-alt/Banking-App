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
  const accounts = await getAccounts({ userId: loggedIn.$id });

  if (!accounts) return null;

  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
  const account = await getAccount({ appwriteItemId });

  const totalBalance = accounts?.totalCurrentBalance || 0;
  const transactions = account?.transactions || [];

  return (
    <section className="flex w-full">
      <div className="no-scrollbar flex w-full flex-1 flex-col gap-6 px-5 sm:px-8 py-7 lg:py-10 xl:max-h-screen xl:overflow-y-scroll">
        {/* Hero balance */}
        <HeroBalance
          userName={loggedIn?.firstName || "Guest"}
          totalBalance={totalBalance}
        />

        {/* Quick actions */}
        <div className="surface p-5 md:p-6">
          <QuickActions />
        </div>

        {/* Two-column grid: spending + activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingBreakdown />
          <ActivityFeed transactions={transactions} />
        </div>
      </div>

      <RightSidebar
        user={loggedIn}
        transactions={transactions}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  );
};

export default Home;
