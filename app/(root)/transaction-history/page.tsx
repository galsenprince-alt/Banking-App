import HeaderBox from "@/components/HeaderBox";
import { Pagination } from "@/components/Pagination";
import TransactionsTable from "@/components/TransactionsTable";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { formatAmount } from "@/lib/utils";

const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
  const { id, page } = await searchParams;
  const currentPage = Number(page as string) || 1;

  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const accounts = await getAccounts({ userId: loggedIn.$id });

  const accountsData = accounts?.data ?? [];
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  const account = appwriteItemId ? await getAccount({ appwriteItemId }) : null;

  const rowsPerPage = 10;
  const totalPages = Math.ceil((account?.transactions?.length ?? 0) / rowsPerPage);

  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
  const currentTransactions = (account?.transactions?.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  ) ?? []) as Transaction[];

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6 max-w-[1200px] mx-auto w-full">
      <HeaderBox
        title="Transaction History"
        subtext="See your bank details and transactions."
      />

      <div className="space-y-6">
        <div className="surface overflow-hidden">
          <div className="flex flex-col justify-between gap-4 bg-bank-gradient px-5 py-5 md:flex-row">
            <div className="flex flex-col gap-2">
              <h2 className="text-16 font-semibold text-white">
                {account?.data?.name ?? "No account selected"}
              </h2>
              <p className="text-13 text-white/70" style={{ fontSize: "13px" }}>
                {account?.data?.officialName ?? ""}
              </p>
              <p className="text-13 font-medium tracking-[1.1px] text-white/90" style={{ fontSize: "13px" }}>
                {account?.data?.mask ? `●●●● ●●●● ●●●● ${account.data.mask}` : ""}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 backdrop-blur-sm px-6 py-3">
              <p className="text-12 text-white/70">Current balance</p>
              <p className="text-22 font-bold text-white font-space-grotesk">
                {formatAmount(account?.data?.currentBalance ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <section className="surface overflow-hidden">
          <div className="p-5">
            <TransactionsTable transactions={currentTransactions} />
          </div>
          {totalPages > 1 && (
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
              <Pagination totalPages={totalPages} page={currentPage} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TransactionHistory;
