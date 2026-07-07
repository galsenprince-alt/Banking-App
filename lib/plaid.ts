import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const rawEnv = (process.env.PLAID_ENV || "sandbox").toLowerCase();

if (!(rawEnv in PlaidEnvironments)) {
  const supported = Object.keys(PlaidEnvironments).join(", ");
  throw new Error(
    `Invalid PLAID_ENV="${rawEnv}". Supported values: ${supported}. ` +
      `(Note: "development" was deprecated by Plaid — use "production" instead.)`
  );
}

const plaidEnv = rawEnv as keyof typeof PlaidEnvironments;

if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  console.warn(
    `[plaid] PLAID_CLIENT_ID or PLAID_SECRET is missing — Plaid calls will fail.`
  );
}

console.log(`[plaid] Initialized in "${plaidEnv}" mode (${PlaidEnvironments[plaidEnv]})`);

const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
