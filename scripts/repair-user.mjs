/**
 * scripts/repair-user.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot repair script for a "half-created" user account.
 *
 * Detects and fixes:
 *  - Appwrite auth account exists but no matching document in `users`
 *  - Document exists but stripeCustomerId is missing
 *
 * Usage:
 *   node --env-file=.env.local scripts/repair-user.mjs muhafaye@hotmail.com
 *
 * Required env vars (same as your Next.js runtime):
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT
 *   APPWRITE_DATABASE_ID
 *   APPWRITE_USER_COLLECTION_ID
 *   APPWRITE_SECRET
 *   STRIPE_SECRET_KEY
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Client, Databases, Users, Query, ID } from "node-appwrite";
import Stripe from "stripe";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/repair-user.mjs <email>");
  process.exit(1);
}

const {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT: PROJECT,
  APPWRITE_DATABASE_ID: DB_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_SECRET: API_KEY,
  STRIPE_SECRET_KEY,
} = process.env;

const missing = Object.entries({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT: PROJECT,
  APPWRITE_DATABASE_ID: DB_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_SECRET: API_KEY,
  STRIPE_SECRET_KEY,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error("Missing env vars:", missing.join(", "));
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const databases = new Databases(client);
const users = new Users(client);
const stripe = new Stripe(STRIPE_SECRET_KEY);

// 1. Find the Appwrite auth account by email
console.log(`\n→ Looking up auth account for ${email}...`);
const authList = await users.list([Query.equal("email", email)]);
const authUser = authList.users[0];
if (!authUser) {
  console.error(`  ✗ No Appwrite auth account found for ${email}`);
  console.error(`    You need to sign up first (the auth account will be created).`);
  process.exit(1);
}
console.log(`  ✓ Auth ID: ${authUser.$id} (name: "${authUser.name}")`);

// 2. Look for existing document in the users collection
console.log(`\n→ Looking up user document in collection ${USER_COLLECTION_ID}...`);
const docs = await databases.listDocuments(DB_ID, USER_COLLECTION_ID, [
  Query.equal("userId", authUser.$id),
]);
let doc = docs.documents[0];

const [firstNameRaw, ...lastNameParts] = (authUser.name || "").split(" ");
const firstName = firstNameRaw || email.split("@")[0];
const lastName = lastNameParts.join(" ") || "";

if (!doc) {
  console.log(`  ✗ No document found — will create one`);

  console.log(`\n→ Creating Stripe customer...`);
  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`.trim(),
  });
  console.log(`  ✓ Stripe customer created: ${customer.id}`);

  console.log(`\n→ Creating Appwrite document...`);
  doc = await databases.createDocument(DB_ID, USER_COLLECTION_ID, ID.unique(), {
    userId: authUser.$id,
    email,
    firstName,
    lastName,
    stripeCustomerId: customer.id,
  });
  console.log(`  ✓ Document created: ${doc.$id}`);
} else {
  console.log(`  ✓ Document exists: ${doc.$id}`);

  if (!doc.stripeCustomerId) {
    console.log(`  ✗ stripeCustomerId is missing — will back-fill`);

    console.log(`\n→ Creating Stripe customer...`);
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`.trim(),
    });
    console.log(`  ✓ Stripe customer created: ${customer.id}`);

    console.log(`\n→ Updating Appwrite document...`);
    doc = await databases.updateDocument(DB_ID, USER_COLLECTION_ID, doc.$id, {
      stripeCustomerId: customer.id,
    });
    console.log(`  ✓ Document updated`);
  } else {
    console.log(`  ✓ stripeCustomerId already set: ${doc.stripeCustomerId}`);
    console.log(`\nNothing to repair. Account is healthy.`);
    process.exit(0);
  }
}

console.log(`\n✓ Repair complete for ${email}`);
console.log(`  Auth ID:            ${authUser.$id}`);
console.log(`  Document ID:        ${doc.$id}`);
console.log(`  stripeCustomerId:   ${doc.stripeCustomerId}`);
