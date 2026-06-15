"use server";

import { Client, Account, Databases, Users, Query, ID } from "node-appwrite";
import { cookies } from "next/headers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Transaction = {
  $id: string;
  $createdAt: string;
  userId: string;
  accountId: string;
  amount: number;
  type: "debit" | "credit" | "transfer";
  status: "pending" | "completed" | "failed" | "cancelled";
  category: string;
  description: string;
  merchantName: string;
  currency: string;
  balanceAfter: number;
  referenceId: string;
};

export type BankAccount = {
  $id: string;
  $createdAt: string;
  userId: string;
  accountNumber: string;
  accountType: "chequing" | "savings" | "credit";
  balance: number;
  creditLimit: number;
  currency: string;
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  isActive: boolean;
};

export type UserProfile = {
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  kycStatus: "pending" | "verified" | "rejected";
  twoFactorEnabled: boolean;
  profileImageId: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT: PROJECT_ID,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID: TRANSACTIONS_ID,
  NEXT_PUBLIC_APPWRITE_BANKS_COLLECTION_ID: BANKS_ID,
  NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID: USERS_ID,
  APPWRITE_SECRET: API_KEY,
} = process.env;

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(ENDPOINT!)
    .setProject(PROJECT_ID!);

  const session = (await cookies()).get("my_appwrite_session");
  if (!session?.value) throw new Error("No session");

  client.setSession(session.value);

  return {
    get account() { return new Account(client); },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(ENDPOINT!)
    .setProject(PROJECT_ID!)
    .setKey(API_KEY!);

  return {
    get account() { return new Account(client); },
    get database() { return new Databases(client); },
    get user() { return new Users(client); },
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Retourne l'utilisateur connecté ou null */
export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

// ─── Profil utilisateur ───────────────────────────────────────────────────────

/** Crée le profil utilisateur dans la collection users */
export async function createUserProfile(data: Omit<UserProfile, "$id">) {
  const { database } = await createAdminClient();
  return await database.createDocument(
    DATABASE_ID!, USERS_ID!, ID.unique(), data
  );
}

/** Récupère le profil utilisateur par son userId Appwrite */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { database } = await createAdminClient();
    const result = await database.listDocuments(DATABASE_ID!, USERS_ID!, [
      Query.equal("$id", userId),
    ]);
    return result.documents[0] as unknown as UserProfile ?? null;
  } catch {
    return null;
  }
}

// ─── Comptes bancaires ────────────────────────────────────────────────────────

/** Récupère tous les comptes d'un utilisateur */
export async function getUserAccounts(userId: string): Promise<BankAccount[]> {
  try {
    const { database } = await createAdminClient();
    const result = await database.listDocuments(DATABASE_ID!, BANKS_ID!, [
      Query.equal("userId", userId),
      Query.equal("isActive", true),
      Query.orderDesc("$createdAt"),
    ]);
    return result.documents as unknown as BankAccount[];
  } catch {
    return [];
  }
}

/** Récupère un compte bancaire par son ID */
export async function getAccountById(accountId: string): Promise<BankAccount | null> {
  try {
    const { database } = await createAdminClient();
    const result = await database.getDocument(DATABASE_ID!, BANKS_ID!, accountId);
    return result as unknown as BankAccount;
  } catch {
    return null;
  }
}

/** Calcule le solde total de tous les comptes */
export async function getTotalBalance(userId: string): Promise<number> {
  const accounts = await getUserAccounts(userId);
  return accounts.reduce((sum, acc) => sum + acc.balance, 0);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/** Récupère les transactions d'un compte avec pagination */
export async function getTransactions(
  accountId: string,
  limit = 10,
  offset = 0
): Promise<{ transactions: Transaction[]; total: number }> {
  try {
    const { database } = await createAdminClient();
    const result = await database.listDocuments(DATABASE_ID!, TRANSACTIONS_ID!, [
      Query.equal("accountId", accountId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ]);
    return {
      transactions: result.documents as unknown as Transaction[],
      total: result.total,
    };
  } catch {
    return { transactions: [], total: 0 };
  }
}

/** Récupère toutes les transactions d'un utilisateur (tous comptes) */
export async function getAllUserTransactions(
  userId: string,
  limit = 20
): Promise<Transaction[]> {
  try {
    const { database } = await createAdminClient();
    const result = await database.listDocuments(DATABASE_ID!, TRANSACTIONS_ID!, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ]);
    return result.documents as unknown as Transaction[];
  } catch {
    return [];
  }
}

/** Crée une nouvelle transaction */
export async function createTransaction(
  data: Omit<Transaction, "$id" | "$createdAt">
): Promise<Transaction | null> {
  try {
    const { database } = await createAdminClient();
    const result = await database.createDocument(
      DATABASE_ID!, TRANSACTIONS_ID!, ID.unique(), data
    );
    return result as unknown as Transaction;
  } catch {
    return null;
  }
}

/** Filtre les transactions par catégorie */
export async function getTransactionsByCategory(
  userId: string,
  category: string
): Promise<Transaction[]> {
  try {
    const { database } = await createAdminClient();
    const result = await database.listDocuments(DATABASE_ID!, TRANSACTIONS_ID!, [
      Query.equal("userId", userId),
      Query.equal("category", category),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ]);
    return result.documents as unknown as Transaction[];
  } catch {
    return [];
  }
}

/** Calcule les dépenses du mois en cours par catégorie */
export async function getMonthlySpending(
  userId: string
): Promise<Record<string, number>> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    const { database } = await createAdminClient();
    const result = await database.listDocuments(DATABASE_ID!, TRANSACTIONS_ID!, [
      Query.equal("userId", userId),
      Query.equal("type", "debit"),
      Query.greaterThanEqual("$createdAt", startOfMonth),
      Query.limit(100),
    ]);

    const spending: Record<string, number> = {};
    for (const doc of result.documents) {
      const tx = doc as unknown as Transaction;
      spending[tx.category] = (spending[tx.category] ?? 0) + Math.abs(tx.amount);
    }
    return spending;
  } catch {
    return {};
  }
}
