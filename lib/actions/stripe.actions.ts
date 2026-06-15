"use server";

import Stripe from "stripe";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { parseStringify } from "@/lib/utils";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
} = process.env;

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-05-27.dahlia",
  });
}

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

// Links a Plaid-verified bank account to Stripe via processor token.
// Uses acss_debit PaymentMethod (Canadian bank accounts) instead of the
// deprecated Sources API (customers.createSource / charges.create).
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
    const stripe = getStripeClient();

    const paymentMethod = await stripe.paymentMethods.create({
      type: "acss_debit",
      acss_debit: { token: processorToken },
      billing_details: { name: bankName },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomerId,
    });

    return paymentMethod.id;
  } catch (error) {
    console.error("Error adding Stripe bank account:", error);
    return null;
  }
};

// Debits the sender's bank account via PaymentIntent (acss_debit).
// Replaces the deprecated charges.create + Sources flow from dwolla.actions.ts.
export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
  senderUserId,
}: {
  sourceFundingSourceUrl: string;
  destinationFundingSourceUrl: string;
  amount: string;
  senderUserId?: string;
}): Promise<{ transferId: string } | undefined> => {
  try {
    let stripeCustomerId: string | undefined;

    if (senderUserId) {
      const { database } = await createAdminClient();
      const users = await database.listDocuments(DATABASE_ID!, USER_COLLECTION_ID!, [
        Query.equal("userId", [senderUserId]),
      ]);
      if (users.documents.length) {
        stripeCustomerId = users.documents[0].stripeCustomerId;
      }
    }

    const stripe = getStripeClient();
    const amountInCents = Math.round(parseFloat(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "cad",
      customer: stripeCustomerId,
      payment_method: sourceFundingSourceUrl,
      payment_method_types: ["acss_debit"],
      confirm: true,
      off_session: true,
      mandate_data: {
        customer_acceptance: { type: "offline" },
      },
      description: `M$F Banking transfer → ${destinationFundingSourceUrl}`,
    });

    return parseStringify({ transferId: paymentIntent.id });
  } catch (error) {
    console.error("Error creating transfer:", error);
  }
};

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
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      customer: stripeCustomerId,
      payment_method: bankAccountId,
      payment_method_types: ["acss_debit"],
      confirm: true,
      off_session: true,
      mandate_data: {
        customer_acceptance: { type: "offline" },
      },
      description: description ?? "MSF Mobile Banking Transfer",
      metadata: { bankAccountId, stripeCustomerId },
    });

    return paymentIntent.id;
  } catch (error) {
    console.error("Error creating Stripe transfer:", error);
    return null;
  }
};

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

export const getStripeBankAccounts = async (
  stripeCustomerId: string
): Promise<Stripe.PaymentMethod[]> => {
  try {
    const stripe = getStripeClient();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "acss_debit",
    });
    return paymentMethods.data;
  } catch (error) {
    console.error("Error getting Stripe bank accounts:", error);
    return [];
  }
};
