"use server";

/**
 * dwolla.actions.ts — compatibility bridge (Dwolla → Stripe)
 *
 * The codebase migrated from Dwolla to Stripe for payment processing.
 * This module keeps the original `createTransfer` signature so that
 * existing callers (PaymentTransferForm) don't need major refactoring,
 * while delegating the actual charge to Stripe.
 */

import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { parseStringify } from "@/lib/utils";

function getStripeClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-05-27.dahlia",
  });
}

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
} = process.env;

/**
 * createTransfer — debits the sender's Stripe bank account.
 *
 * @param sourceFundingSourceUrl  Stripe bank-account source ID (stored as fundingSourceUrl)
 * @param destinationFundingSourceUrl  Receiver's Stripe bank-account ID (recorded for audit)
 * @param amount  Amount as a decimal string, e.g. "25.00"
 * @param senderUserId  Appwrite userId of the sender (used to look up stripeCustomerId)
 */
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
}) => {
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

    const charge = await stripe.charges.create({
      amount: amountInCents,
      currency: "usd",
      ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
      source: sourceFundingSourceUrl,
      description: `M$F Banking transfer → ${destinationFundingSourceUrl}`,
    });

    return parseStringify({ transferId: charge.id });
  } catch (error) {
    console.error("Error creating transfer:", error);
  }
};
