"use server";

import Stripe from "stripe";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion : "2026-05-27.dahlia",
  });
}

// ─── Créer un client Stripe (remplace createDwollaCustomer) ───────────────────
export const createStripeCustomer = async ({
  email,
  firstName,
  lastName,
}: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<string | null> => {
  try {
    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
    });
    return customer.id;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return null;
  }
};

// ─── Lier un compte bancaire Plaid à Stripe (remplace addFundingSource) ────────
export const addStripeBankAccount = async ({
  stripeCustomerId,
  processorToken,
  bankName,
}: {
  stripeCustomerId: string;
  processorToken: string;
  bankName: string;
}): Promise<string | null> => {
  try {
    if (!stripeCustomerId) {
      console.error("addStripeBankAccount: stripeCustomerId is missing");
      return null;
    }
    if (!processorToken) {
      console.error("addStripeBankAccount: processorToken is missing");
      return null;
    }

    const stripe = getStripeClient();

    // Plaid processor token for Stripe (btok_xxx) used as a bank account token
    const bankAccount = await stripe.customers.createSource(
      stripeCustomerId,
      { source: processorToken }
    );

    console.log(`Bank account linked: ${bankName} (${bankAccount.id})`);
    return bankAccount.id;
  } catch (error: any) {
    const msg = error?.message ?? "Unknown Stripe error";
    const code = error?.code ?? "";
    console.error(`Error adding Stripe bank account [${code}]: ${msg}`);
    console.error("stripeCustomerId:", stripeCustomerId);
    console.error("processorToken prefix:", processorToken?.substring(0, 10) + "...");
    return null;
  }
};

// ─── Créer un transfert (remplace createTransfer) ─────────────────────────────
export const createStripeTransfer = async ({
  stripeCustomerId,
  bankAccountId,
  amount,
  currency = "cad",
  description,
}: {
  stripeCustomerId: string;
  bankAccountId: string;
  amount: number;
  currency?: string;
  description?: string;
}): Promise<string | null> => {
  try {
    const stripe = getStripeClient();

    // Convertit le montant en cents (Stripe utilise les sous-unités)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      customer: stripeCustomerId,
      payment_method_types: ["us_bank_account"],
      description: description ?? "MSF Mobile Banking Transfer",
      metadata: {
        bankAccountId,
        stripeCustomerId,
      },
    });

    return paymentIntent.id;
  } catch (error) {
    console.error("Error creating Stripe transfer:", error);
    return null;
  }
};

// ─── Récupérer les détails d'un client Stripe ─────────────────────────────────
export const getStripeCustomer = async (
  stripeCustomerId: string
): Promise<Stripe.Customer | null> => {
  try {
    const stripe = getStripeClient();
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    return customer as Stripe.Customer;
  } catch (error) {
    console.error("Error getting Stripe customer:", error);
    return null;
  }
};

// ─── Lister les comptes bancaires d'un client Stripe ─────────────────────────
export const getStripeBankAccounts = async (
  stripeCustomerId: string
): Promise<Stripe.BankAccount[]> => {
  try {
    const stripe = getStripeClient();
    const sources = await stripe.customers.listSources(stripeCustomerId, {
      object: "bank_account",
    });
    return sources.data as Stripe.BankAccount[];
  } catch (error) {
    console.error("Error getting Stripe bank accounts:", error);
    return [];
  }
};