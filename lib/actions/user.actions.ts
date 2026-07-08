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

// ─── ensureUserDocument ───────────────────────────────────────────────────────
// Idempotent repair: given an Appwrite auth account, guarantee that a matching
// document exists in the users collection with a valid stripeCustomerId.
// Called from signUp (main path) AND getLoggedInUser (self-heal on read).
async function ensureUserDocument(params: {
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  extra?: {
    address1?: string;
    city?: string;
    postalCode?: string;
    dateOfBirth?: string;
  };
}): Promise<User> {
  const { authId, email, firstName, lastName, extra } = params;
  const { database } = await createAdminClient();

  // 1. Does the document already exist?
  const existing = await database.listDocuments(DATABASE_ID!, USER_COLLECTION_ID!, [
    Query.equal("userId", [authId]),
  ]);
  let doc = existing.documents[0];

  // 2. Missing → create Stripe customer + document
  if (!doc) {
    const stripeCustomerId = await createStripeCustomer({ email, firstName, lastName });
    if (!stripeCustomerId) {
      throw new Error("Failed to create Stripe customer during user document repair");
    }
    doc = await database.createDocument(
      DATABASE_ID!, USER_COLLECTION_ID!, ID.unique(),
      {
        userId: authId,
        email,
        firstName,
        lastName,
        ...(extra?.address1 && { adress1: extra.address1 }),
        ...(extra?.city && { city: extra.city }),
        ...(extra?.postalCode && { postalCode: extra.postalCode }),
        ...(extra?.dateOfBirth && { dateOfBirth: extra.dateOfBirth }),
        stripeCustomerId,
      }
    );
    console.log(`[ensureUserDocument] Created document for ${email} with Stripe ${stripeCustomerId}`);
  }

  // 3. Document exists but stripeCustomerId is missing → back-fill it
  if (!(doc as any).stripeCustomerId) {
    const stripeCustomerId = await createStripeCustomer({ email, firstName, lastName });
    if (!stripeCustomerId) {
      throw new Error("Failed to create Stripe customer during back-fill");
    }
    doc = await database.updateDocument(
      DATABASE_ID!, USER_COLLECTION_ID!, doc.$id,
      { stripeCustomerId }
    );
    console.log(`[ensureUserDocument] Back-filled stripeCustomerId=${stripeCustomerId} for ${email}`);
  }

  return parseStringify(doc) as unknown as User;
}

// ─── signUp ───────────────────────────────────────────────────────────────────
export const signUp = async ({ password, ...userData }: SignUpParams): Promise<User | { error: string } | undefined> => {
  const { email, firstName, lastName } = userData;
  try {
    const { account } = await createAdminClient();

    // 1. Créer le compte Appwrite Auth
    const newUserAccount = await account.create(
      ID.unique(), email, password, `${firstName} ${lastName}`
    );
    if (!newUserAccount) throw new Error("Error creating Appwrite auth account");

    // 2. Créer Stripe customer + document Appwrite (idempotent)
    const user = await ensureUserDocument({
      authId: newUserAccount.$id,
      email, firstName, lastName,
      extra: {
        address1: userData.address1,
        city: userData.city,
        postalCode: userData.postalCode,
        dateOfBirth: userData.dateOfBirth,
      },
    });

    // 3. Créer la session
    const session = await account.createEmailPasswordSession(email, password);
    (await cookies()).set("my_appwrite_session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return user;
  } catch (error: any) {
    const message = error?.response?.message ?? error?.message ?? "Unknown sign-up error";
    console.error("Error during sign up:", message, error);
    return { error: message };
  }
};

// ─── getLoggedInUser ──────────────────────────────────────────────────────────
export const getLoggedInUser = async (): Promise<User | null> => {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();
    const existing = await getUserInfo({ userId: result.$id });
    if (existing?.stripeCustomerId) return existing;

    const [firstName, ...rest] = (result.name || "").split(" ");
    const fn = firstName || result.email.split("@")[0];
    const ln = rest.join(" ") || "";

    if (existing) return existing;

    try {
      return await ensureUserDocument({
        authId: result.$id,
        email: result.email,
        firstName: fn,
        lastName: ln,
      });
    } catch (healError) {
      console.error("[getLoggedInUser] self-heal failed, returning basic user:", healError);
      return {
        $id: result.$id,
        userId: result.$id,
        email: result.email,
        firstName: fn,
        lastName: ln,
      } as unknown as User;
    }
  } catch (error) {
    console.error("[getLoggedInUser] error:", error);
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
export const createLinkToken = async (user: User): Promise<{ linkToken: string; error?: string }> => {
  try {
    if (!user?.$id) {
      console.error("createLinkToken: user.$id is missing");
      return { linkToken: "", error: "User ID is missing" };
    }
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      console.error("createLinkToken: PLAID_CLIENT_ID or PLAID_SECRET env vars missing");
      return { linkToken: "", error: "Plaid is not configured" };
    }
    const tokenParams = {
      user: { client_user_id: user.$id },
      client_name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "M$F Banking",
      products: ["auth"] as Products[],
      language: "en",
      country_codes: ["CA", "US"] as CountryCode[],
    };
    const response = await plaidClient.linkTokenCreate(tokenParams);
    return parseStringify({ linkToken: response.data.link_token });
  } catch (error: any) {
    const message = error?.response?.data?.error_message ?? error?.message ?? "Unknown Plaid error";
    console.error("Error creating link token:", message, error?.response?.data);
    return { linkToken: "", error: message };
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
}: exchangePublicTokenProps): Promise<{ publicTokenExchange?: string; error?: string }> => {
  try {
    if (!user?.stripeCustomerId) {
      console.error("exchangePublicToken: user.stripeCustomerId is missing");
      return { error: "Stripe customer not found. Please sign up again." };
    }

    // 1. Échanger le token public Plaid
    const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // 2. Récupérer les infos du compte
    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const accountData = accountsResponse.data.accounts[0];

    // 3. Créer un processor token Stripe
    const processorTokenResponse = await plaidClient.processorTokenCreate({
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "stripe" as ProcessorTokenCreateRequestProcessorEnum,
    });
    const processorToken = processorTokenResponse.data.processor_token;

    // 4. Lier le compte bancaire à Stripe
    const stripeBankAccountId = await addStripeBankAccount({
      stripeCustomerId: user.stripeCustomerId,
      processorToken,
      bankName: accountData.name,
    });
    if (!stripeBankAccountId) {
      return { error: "Failed to link bank account to Stripe" };
    }

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
  } catch (error: any) {
    const message = error?.response?.data?.error_message ?? error?.message ?? "Unknown error";
    console.error("Error exchanging public token:", message, error?.response?.data ?? error);
    return { error: message };
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