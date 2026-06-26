"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { createStripeCustomer, addStripeBankAccount } from "./stripe.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

// ─── getUserInfo ──────────────────────────────────────────────────────────────
export const getUserInfo = async ({ userId }: getUserInfoProps): Promise<User | undefined> => {
  try {
    const { database } = await createAdminClient();
    const user = await database.listDocuments(DATABASE_ID!, USER_COLLECTION_ID!, [
      Query.equal("userId", [userId]),
    ]);
    if (!user.documents[0]) return undefined;
    return parseStringify(user.documents[0]) as unknown as User;
  } catch (error) {
    console.error(error);
  }
};

// ─── signIn ───────────────────────────────────────────────────────────────────
export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    (await cookies()).set("my_appwrite_session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    const user = await getUserInfo({ userId: session.userId });
    return user ?? { $id: session.userId, email } as unknown as User;
  } catch (error) {
    console.error("Error during sign in:", error);
  }
};

// ─── signUp ───────────────────────────────────────────────────────────────────
export const signUp = async ({ password, ...userData }: SignUpParams): Promise<User | undefined> => {
  const { email, firstName, lastName } = userData;
  try {
    const { account, database } = await createAdminClient();

    // 1. Créer le compte Appwrite Auth
    const newUserAccount = await account.create(
      ID.unique(), email, password, `${firstName} ${lastName}`
    );
    if (!newUserAccount) throw new Error("Error creating user");

    // 2. Créer le client Stripe (remplace Dwolla)
    const stripeCustomerId = await createStripeCustomer({ email, firstName, lastName });
    if (!stripeCustomerId) throw new Error("Error creating Stripe customer");

    // 3. Sauvegarder dans Appwrite
    const newUser = await database.createDocument(
      DATABASE_ID!, USER_COLLECTION_ID!, ID.unique(),
      {
        userId: newUserAccount.$id,
        email,
        firstName,
        lastName,
        adress1: userData.address1,
        city: userData.city,
        postalCode: userData.postalCode,
        dateOfBirth: userData.dateOfBirth,
        stripeCustomerId,
      }
    );

    // 4. Créer la session
    const session = await account.createEmailPasswordSession(email, password);
    (await cookies()).set("my_appwrite_session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUser) as unknown as User;
  } catch (error) {
    console.error("Error during sign up:", error);
  }
};

// ─── getLoggedInUser ──────────────────────────────────────────────────────────
export const getLoggedInUser = async (): Promise<User | null> => {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();
    const user = await getUserInfo({ userId: result.$id });
    if (user) return user;
    return {
      $id: result.$id,
      userId: result.$id,
      email: result.email,
      firstName: result.name?.split(" ")[0] ?? "",
      lastName: result.name?.split(" ").slice(1).join(" ") ?? "",
    } as unknown as User;
  } catch (_error) {
    return null;
  }
};

// ─── logoutAccount ────────────────────────────────────────────────────────────
export const logoutAccount = async () => {
  try {
    (await cookies()).delete("my_appwrite_session");
    const { account } = await createSessionClient();
    await account.deleteSession("current");
    return true;
  } catch (_error) {
    (await cookies()).delete("my_appwrite_session");
    return null;
  }
};

// ─── createLinkToken (Plaid) ──────────────────────────────────────────────────
export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: { client_user_id: user.$id },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ["auth"] as Products[],
      language: "en",
      country_codes: ["CA", "US"] as CountryCode[],
    };
    const response = await plaidClient.linkTokenCreate(tokenParams);
    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.error("Error creating link token:", error);
  }
};

// ─── createBankAccount ────────────────────────────────────────────────────────
export const createBankAccount = async ({
  userId, bankId, accountId, accessToken, fundingSourceUrl, sharableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();
    const bankAccount = await database.createDocument(
      DATABASE_ID!, BANK_COLLECTION_ID!, ID.unique(),
      { userId, bankId, accountId, accessToken, fundingSourceUrl, sharableId }
    );
    return parseStringify(bankAccount);
  } catch (error) {
    console.error("Error creating bank account:", error);
  }
};

// ─── exchangePublicToken (Plaid → Stripe) ────────────────────────────────────
export const exchangePublicToken = async ({
  publicToken, user,
}: exchangePublicTokenProps) => {
  try {
    // 1. Échanger le token public Plaid
    const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // 2. Récupérer les infos du compte
    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const accountData = accountsResponse.data.accounts[0];

    // 3. Créer un processor token Stripe (remplace Dwolla)
    const processorTokenResponse = await plaidClient.processorTokenCreate({
      access_token: accessToken,
      account_id: accountData.account_id,
processor: "stripe" as ProcessorTokenCreateRequestProcessorEnum,    });
    const processorToken = processorTokenResponse.data.processor_token;

    // 4. Lier le compte bancaire à Stripe
    const stripeBankAccountId = await addStripeBankAccount({
      stripeCustomerId: user.stripeCustomerId,
      processorToken,
      bankName: accountData.name,
    });
    if (!stripeBankAccountId) throw new Error("Error adding Stripe bank account");

    // 5. Sauvegarder dans Appwrite
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl: stripeBankAccountId,
      sharableId: encryptId(accountData.account_id),
    });

    revalidatePath("/");
    return parseStringify({ publicTokenExchange: "complete" });
  } catch (error) {
    console.error("Error exchanging public token:", error);
  }
};

// ─── getBanks ─────────────────────────────────────────────────────────────────
export const getBanks = async ({ userId }: getBanksProps): Promise<Bank[] | undefined> => {
  try {
    const { database } = await createAdminClient();
    const banks = await database.listDocuments(
      DATABASE_ID!, BANK_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );
    return parseStringify(banks.documents) as unknown as Bank[];
  } catch (error) {
    console.error("Error getting banks:", error);
  }
};

// ─── getBank ──────────────────────────────────────────────────────────────────
export const getBank = async ({ documentId }: getBankProps): Promise<Bank | undefined> => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      DATABASE_ID!, BANK_COLLECTION_ID!,
      [Query.equal("$id", [documentId])]
    );
    return parseStringify(bank.documents[0]) as unknown as Bank;
  } catch (error) {
    console.error("Error getting bank:", error);
  }
};

// ─── getBankByAccountId ───────────────────────────────────────────────────────
export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps): Promise<Bank | null | undefined> => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      DATABASE_ID!, BANK_COLLECTION_ID!,
      [Query.equal("accountId", [accountId])]
    );
    if (bank.total !== 1) return null;
    return parseStringify(bank.documents[0]) as unknown as Bank;
  } catch (error) {
    console.error("Error getting bank by account ID:", error);
  }
};