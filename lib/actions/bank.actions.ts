"use server";

import { CountryCode } from "plaid";
import { plaidClient } from "@/lib/plaid";
import { parseStringify } from "../utils";
import { getBanks, getBank } from "./user.actions";
import { getTransactionsByBankId } from "./transaction.actions";

export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    const banks = await getBanks({ userId });

    const accounts = await Promise.all(
      banks?.map(async (bank: Bank) => {
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });
        const accountData = accountsResponse.data.accounts[0];

        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        });

        return {
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          appwriteItemId: bank.$id,
          sharableId: bank.sharableId,
        };
      })
    );

    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce(
      (total, account) => total + account.currentBalance,
      0
    );

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("Error getting accounts:", error);
  }
};

export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    const bank = await getBank({ documentId: appwriteItemId });

    const [accountsResponse, transferTransactionsData] = await Promise.all([
      plaidClient.accountsGet({ access_token: bank.accessToken }),
      getTransactionsByBankId({ bankId: appwriteItemId }),
    ]);

    const accountData = accountsResponse.data.accounts[0];

    const transferTransactions = transferTransactionsData.documents.map(
      (transferData: Transaction & { $id: string; $createdAt: string }) => ({
        id: transferData.$id,
        name: transferData.name,
        amount: transferData.amount,
        date: transferData.$createdAt,
        paymentChannel: transferData.paymentChannel ?? "online",
        category: transferData.category ?? "Transfer",
        type:
          transferData.senderBankId === appwriteItemId ? "debit" : "credit",
      })
    );

    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    const transactions = await getTransactions({
      accessToken: bank.accessToken,
    });

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
      sharableId: bank.sharableId,
    };

    const allTransactions = [
      ...transactions,
      ...transferTransactions,
    ].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({ data: account, transactions: allTransactions });
  } catch (error) {
    console.error("Error getting account:", error);
  }
};

export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const response = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["CA", "US"] as CountryCode[],
    });

    return parseStringify(response.data.institution);
  } catch (error) {
    console.error("Error getting institution:", error);
  }
};

export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  let hasMore = true;
  let transactions: Transaction[] = [];

  try {
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      });

      const data = response.data;

      const mapped = data.added.map((t) => ({
        id: t.transaction_id,
        name: t.name,
        paymentChannel: t.payment_channel,
        type: t.payment_channel,
        accountId: t.account_id,
        amount: t.amount,
        pending: t.pending,
        category: t.category ? t.category[0] : "",
        date: t.date,
        image: t.logo_url ?? "",
        $id: t.transaction_id,
        $createdAt: t.date,
        channel: t.payment_channel,
        senderBankId: "",
        receiverBankId: "",
      }));

      transactions = [...transactions, ...mapped];
      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
};
