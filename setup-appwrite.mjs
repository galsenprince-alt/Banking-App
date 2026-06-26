/**
 * setup-appwrite.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot provisioning script for the M$F Banking Appwrite backend.
 * Re-runnable: 409 "already exists" errors are silently skipped.
 *
 * Usage:
 *   node --env-file=.env.local setup-appwrite.mjs
 *
 * Required env vars (copy .env.example → .env.local and fill in):
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT
 *   APPWRITE_DATABASE_ID
 *   APPWRITE_SECRET
 *
 * What this script creates
 * ─────────────────────────
 * DATABASE COLLECTIONS (with attributes + indexes + permissions)
 *   existing → users · banks · transactions
 *   new      → cards · beneficiaries · notifications · budgets · documents · appointments
 *
 * STORAGE BUCKETS
 *   profile-images  (jpg/png/webp, max 5 MB, encrypted)
 *   documents       (pdf/docx/csv, max 20 MB, encrypted)
 *
 * FUNCTIONS
 *   transaction-email-confirmation  (Node 18, manually invoked)
 *
 * PERMISSIONS (applied to every collection)
 *   Read   → Role.users()        (any authenticated user)
 *   Create → Role.users()
 *   Update → Role.users()
 *   Delete → Role.label("admin") (admin-labelled users only)
 *   documentSecurity: true       (per-document ACLs in your app code)
 *
 * MANUAL STEPS (Appwrite Console — not scriptable via REST)
 *   AUTH     → enable Email/Password + OAuth Google + OAuth Apple
 *   MESSAGING → add Firebase FCM provider + subscribe users to topics
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Client,
  Databases,
  Storage,
  Functions,
  Permission,
  Role,
  ID,
} from "node-appwrite";

// ─── Validate env ─────────────────────────────────────────────────────────────
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT  = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const DB_ID    = process.env.APPWRITE_DATABASE_ID;
const API_KEY  = process.env.APPWRITE_SECRET;

if (!ENDPOINT || !PROJECT || !DB_ID || !API_KEY) {
  console.error("❌  Missing required environment variables.");
  console.error("    Run:  node --env-file=.env.local setup-appwrite.mjs");
  process.exit(1);
}

// ─── Admin client ─────────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage   = new Storage(client);
const functions = new Functions(client);

// ─── Permission presets ───────────────────────────────────────────────────────
const MEMBER_PERMS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.label("admin")),
];

const BUCKET_PERMS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.label("admin")),
];

// ─── Helper: create-or-skip ───────────────────────────────────────────────────
async function tryCreate(label, fn) {
  try {
    await fn();
    console.log(`  ✅  ${label}`);
  } catch (err) {
    const code = err?.code ?? err?.response?.code;
    if (code === 409) {
      console.log(`  ⚠️   ${label}  (already exists — skipped)`);
    } else {
      console.error(`  ❌  ${label}  →  ${err.message ?? err}`);
      // Non-fatal so the rest of the script continues.
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  COLLECTIONS
// ═════════════════════════════════════════════════════════════════════════════

async function setupCollections() {
  console.log("\n📦  Collections");

  // ── users ──────────────────────────────────────────────────────────────────
  await tryCreate("users", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "users",
      name: "Users",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",            type: "string",  size: 36,  required: true  },
        { key: "email",             type: "string",  size: 256, required: true  },
        { key: "firstName",         type: "string",  size: 100, required: true  },
        { key: "lastName",          type: "string",  size: 100, required: true  },
        { key: "adress1",           type: "string",  size: 256, required: false },
        { key: "city",              type: "string",  size: 100, required: false },
        { key: "postalCode",        type: "string",  size: 10,  required: false },
        { key: "dateOfBirth",       type: "string",  size: 20,  required: false },
        { key: "stripeCustomerId",  type: "string",  size: 100, required: false },
      ],
      indexes: [
        { key: "email_idx",  type: "key",    attributes: ["email"],  orders: ["ASC"] },
        { key: "userId_idx", type: "unique", attributes: ["userId"], orders: ["ASC"] },
      ],
    })
  );

  // ── banks ──────────────────────────────────────────────────────────────────
  await tryCreate("banks", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "banks",
      name: "Banks",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",           type: "string", size: 36,  required: true  },
        { key: "bankId",           type: "string", size: 100, required: true  },
        { key: "accountId",        type: "string", size: 100, required: true  },
        { key: "accessToken",      type: "string", size: 512, required: true  },
        { key: "fundingSourceUrl", type: "string", size: 512, required: false },
        { key: "shareableId",      type: "string", size: 100, required: false },
      ],
      indexes: [
        { key: "userId_idx",    type: "key", attributes: ["userId"],    orders: ["ASC"] },
        { key: "accountId_idx", type: "key", attributes: ["accountId"], orders: ["ASC"] },
      ],
    })
  );

  // ── transactions ──────────────────────────────────────────────────────────
  await tryCreate("transactions", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "transactions",
      name: "Transactions",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "name",           type: "string",  size: 256, required: true  },
        { key: "accountId",      type: "string",  size: 100, required: true  },
        { key: "amount",         type: "float",              required: true  },
        { key: "channel",        type: "string",  size: 50,  required: false },
        { key: "category",       type: "string",  size: 100, required: false },
        { key: "date",           type: "string",  size: 30,  required: true  },
        { key: "pending",        type: "boolean",            required: false, default: false },
        { key: "senderId",       type: "string",  size: 36,  required: false },
        { key: "receiverId",     type: "string",  size: 36,  required: false },
        { key: "type",           type: "string",  size: 20,  required: false },
        { key: "senderBankId",   type: "string",  size: 100, required: false },
        { key: "receiverBankId", type: "string",  size: 100, required: false },
        { key: "email",          type: "string",  size: 256, required: false },
        { key: "paymentChannel", type: "string",  size: 50,  required: false },
      ],
      indexes: [
        { key: "accountId_idx",  type: "key", attributes: ["accountId"],  orders: ["ASC"]  },
        { key: "senderId_idx",   type: "key", attributes: ["senderId"],   orders: ["ASC"]  },
        { key: "receiverId_idx", type: "key", attributes: ["receiverId"], orders: ["ASC"]  },
        { key: "date_idx",       type: "key", attributes: ["date"],       orders: ["DESC"] },
      ],
    })
  );

  // ── cards ─────────────────────────────────────────────────────────────────
  // Virtual debit/credit card records — PAN is never stored in plain text,
  // only the last-4 digits for display.
  await tryCreate("cards", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "cards",
      name: "Cards",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",      type: "string",   size: 36,  required: true  },
        { key: "bankId",      type: "string",   size: 100, required: false },
        { key: "last4",       type: "string",   size: 4,   required: true  },
        { key: "cardType",    type: "string",   size: 10,  required: false }, // debit | credit
        { key: "network",     type: "string",   size: 20,  required: false }, // Visa | Mastercard
        { key: "expiryMonth", type: "integer",             required: true  },
        { key: "expiryYear",  type: "integer",             required: true  },
        // active | blocked | lost | expired
        { key: "status",      type: "string",   size: 20,  required: true  },
        { key: "nameOnCard",  type: "string",   size: 100, required: false },
        { key: "isDefault",   type: "boolean",             required: false, default: false },
        { key: "createdAt",   type: "datetime",            required: false },
      ],
      indexes: [
        { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
        { key: "status_idx", type: "key", attributes: ["status"], orders: ["ASC"] },
      ],
    })
  );

  // ── beneficiaries ─────────────────────────────────────────────────────────
  // Saved Interac / ACH transfer contacts
  await tryCreate("beneficiaries", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "beneficiaries",
      name: "Beneficiaries",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",                 type: "string",   size: 36,  required: true  },
        { key: "name",                   type: "string",   size: 100, required: true  },
        { key: "email",                  type: "string",   size: 256, required: true  },
        { key: "phone",                  type: "string",   size: 20,  required: false },
        { key: "bankName",               type: "string",   size: 100, required: false },
        { key: "accountNumber",          type: "string",   size: 50,  required: false },
        { key: "routingNumber",          type: "string",   size: 20,  required: false },
        { key: "dwollaFundingSourceUrl", type: "string",   size: 512, required: false },
        { key: "nickname",               type: "string",   size: 50,  required: false },
        { key: "createdAt",              type: "datetime",            required: false },
      ],
      indexes: [
        { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
        { key: "email_idx",  type: "key", attributes: ["email"],  orders: ["ASC"] },
      ],
    })
  );

  // ── notifications ─────────────────────────────────────────────────────────
  // In-app alerts: transaction received, login attempt, budget limit reached…
  await tryCreate("notifications", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "notifications",
      name: "Notifications",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",    type: "string",   size: 36,   required: true  },
        { key: "title",     type: "string",   size: 128,  required: true  },
        { key: "body",      type: "string",   size: 512,  required: true  },
        // transaction | login | limit | transfer
        { key: "type",      type: "string",   size: 30,   required: true  },
        { key: "read",      type: "boolean",              required: false, default: false },
        // JSON string for extra payload (e.g. transactionId, amount)
        { key: "metadata",  type: "string",   size: 1024, required: false },
        { key: "createdAt", type: "datetime",             required: true  },
      ],
      indexes: [
        { key: "userId_idx",    type: "key", attributes: ["userId"],    orders: ["ASC"]  },
        { key: "read_idx",      type: "key", attributes: ["read"],      orders: ["ASC"]  },
        { key: "createdAt_idx", type: "key", attributes: ["createdAt"], orders: ["DESC"] },
      ],
    })
  );

  // ── budgets ───────────────────────────────────────────────────────────────
  // Monthly / weekly / yearly category spending limits with alert thresholds
  await tryCreate("budgets", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "budgets",
      name: "Budgets",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",         type: "string",  size: 36,  required: true           },
        // e.g. "Food and Drink", "Travel", "Shopping"
        { key: "category",       type: "string",  size: 100, required: true           },
        { key: "limitAmount",    type: "float",              required: true           },
        { key: "spentAmount",    type: "float",              required: false, default: 0    },
        // monthly | weekly | yearly
        { key: "period",         type: "string",  size: 10,  required: true           },
        { key: "startDate",      type: "string",  size: 20,  required: true           }, // YYYY-MM-DD
        { key: "currency",       type: "string",  size: 3,   required: false, default: "USD" },
        // 0.0–1.0: alert fires when spentAmount / limitAmount >= alertThreshold
        { key: "alertThreshold", type: "float",              required: false, default: 0.8  },
        { key: "alertSent",      type: "boolean",            required: false, default: false },
      ],
      indexes: [
        { key: "userId_idx",   type: "key", attributes: ["userId"],   orders: ["ASC"] },
        { key: "category_idx", type: "key", attributes: ["category"], orders: ["ASC"] },
        { key: "period_idx",   type: "key", attributes: ["period"],   orders: ["ASC"] },
      ],
    })
  );

  // ── documents ─────────────────────────────────────────────────────────────
  // Monthly PDF statements, T4/T5 tax slips, and other financial documents
  await tryCreate("documents", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "documents",
      name: "Documents",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",       type: "string",   size: 36,  required: true  },
        // e.g. "Statement – January 2025"
        { key: "name",         type: "string",   size: 256, required: true  },
        // statement | tax-t4 | tax-t5 | other
        { key: "docType",      type: "string",   size: 30,  required: true  },
        // $id of the file stored in the "documents" Storage bucket
        { key: "bucketFileId", type: "string",   size: 36,  required: true  },
        { key: "size",         type: "integer",             required: false }, // bytes
        { key: "mimeType",     type: "string",   size: 100, required: false }, // application/pdf
        { key: "year",         type: "integer",             required: false },
        { key: "month",        type: "integer",             required: false }, // 1–12
        { key: "createdAt",    type: "datetime",            required: false },
      ],
      indexes: [
        { key: "userId_idx",    type: "key", attributes: ["userId"],    orders: ["ASC"]  },
        { key: "docType_idx",   type: "key", attributes: ["docType"],   orders: ["ASC"]  },
        { key: "createdAt_idx", type: "key", attributes: ["createdAt"], orders: ["DESC"] },
      ],
    })
  );

  // ── appointments ──────────────────────────────────────────────────────────
  // Financial-advisor meeting bookings
  await tryCreate("appointments", () =>
    databases.createCollection({
      databaseId: DB_ID,
      collectionId: "appointments",
      name: "Appointments",
      permissions: MEMBER_PERMS,
      documentSecurity: true,
      attributes: [
        { key: "userId",       type: "string",   size: 36,   required: true  },
        { key: "advisorName",  type: "string",   size: 100,  required: false },
        { key: "advisorEmail", type: "string",   size: 256,  required: false },
        { key: "date",         type: "string",   size: 20,   required: true  }, // YYYY-MM-DD
        { key: "time",         type: "string",   size: 10,   required: true  }, // HH:MM
        { key: "duration",     type: "integer",              required: false, default: 60 }, // minutes
        // scheduled | confirmed | cancelled | completed
        { key: "status",       type: "string",   size: 20,   required: true  },
        { key: "notes",        type: "string",   size: 1024, required: false },
        { key: "meetingLink",  type: "string",   size: 512,  required: false }, // Zoom / Meet URL
        { key: "location",     type: "string",   size: 256,  required: false },
        { key: "createdAt",    type: "datetime",             required: false },
      ],
      indexes: [
        { key: "userId_idx", type: "key", attributes: ["userId"], orders: ["ASC"] },
        { key: "date_idx",   type: "key", attributes: ["date"],   orders: ["ASC"] },
        { key: "status_idx", type: "key", attributes: ["status"], orders: ["ASC"] },
      ],
    })
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  STORAGE BUCKETS
// ═════════════════════════════════════════════════════════════════════════════

async function setupStorage() {
  console.log("\n🗂️   Storage Buckets");

  // User profile pictures: images only, max 5 MB, server-side encryption
  await tryCreate("profile-images bucket", () =>
    storage.createBucket({
      bucketId: "profile-images",
      name: "Profile Images",
      permissions: BUCKET_PERMS,
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 5 * 1024 * 1024, // 5 MB
      allowedFileExtensions: ["jpg", "jpeg", "png", "webp", "gif"],
      encryption: true,
      antivirus: true,
    })
  );

  // Financial documents: PDFs, spreadsheets, max 20 MB, encrypted
  await tryCreate("documents bucket", () =>
    storage.createBucket({
      bucketId: "documents",
      name: "Documents",
      permissions: BUCKET_PERMS,
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 20 * 1024 * 1024, // 20 MB
      allowedFileExtensions: ["pdf", "doc", "docx", "xls", "xlsx", "csv"],
      encryption: true,
      antivirus: true,
    })
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

async function setupFunctions() {
  console.log("\n⚡  Functions");

  // Sends a confirmation email after a successful money transfer.
  // Manually invoked from the app via functions.createExecution().
  // Deploy the function code from the Appwrite Console → Functions.
  await tryCreate("transaction-email-confirmation function", () =>
    functions.create({
      functionId: "transaction-email-confirmation",
      name: "Transaction Email Confirmation",
      runtime: "node-18.0",
      execute: [Role.users()],  // any authenticated user can trigger
      events: [],               // manually invoked (not event-driven)
      schedule: "",
      timeout: 15,
      enabled: true,
      logging: true,
      entrypoint: "src/index.js",
      commands: "npm install",
    })
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚀  M$F Banking — Appwrite Setup");
  console.log(`    Endpoint : ${ENDPOINT}`);
  console.log(`    Project  : ${PROJECT}`);
  console.log(`    Database : ${DB_ID}`);

  await setupCollections();
  await setupStorage();
  await setupFunctions();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Setup complete!

──────────────────────────────────────────────────────────
MANUAL STEPS (Appwrite Console — cannot be scripted)
──────────────────────────────────────────────────────────

1. AUTH  (Console → Auth → Settings)
   ✓ Email / Password login  — enable if not already on
   ✓ OAuth → Google          — add Client ID + Secret
                               (Google Cloud Console → OAuth 2.0)
   ✓ OAuth → Apple           — add Service ID + Key ID + Private Key
                               (Apple Developer → Certificates)

2. MESSAGING  (push notifications via Firebase FCM)
   Console → Messaging → Providers → Add → Firebase (FCM)
   → Paste your FCM Server Key
     (Firebase Console → Project Settings → Cloud Messaging)

   Then in your app code subscribe users:
     await messaging.createSubscriber({
       topicId: "transactions",
       subscriberId: ID.unique(),
       targetId: "<user FCM token>",
     });

3. FUNCTIONS — deploy email confirmation code
   Console → Functions → transaction-email-confirmation
   → Create deployment (upload a zip or connect GitHub)
   → Set environment variables:
       RESEND_API_KEY=re_...
       EMAIL_FROM=no-reply@msfbanking.com

4. Add these IDs to your .env.local:
   APPWRITE_CARDS_COLLECTION_ID=cards
   APPWRITE_BENEFICIARIES_COLLECTION_ID=beneficiaries
   APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications
   APPWRITE_BUDGETS_COLLECTION_ID=budgets
   APPWRITE_DOCUMENTS_COLLECTION_ID=documents
   APPWRITE_APPOINTMENTS_COLLECTION_ID=appointments
   APPWRITE_PROFILE_IMAGES_BUCKET_ID=profile-images
   APPWRITE_DOCUMENTS_BUCKET_ID=documents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message ?? err);
  process.exit(1);
});
