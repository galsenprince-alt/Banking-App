import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const rawEnv = (process.env.PLAID_ENV || "sandbox").trim().toLowerCase();

let plaidEnv: keyof typeof PlaidEnvironments;
if (rawEnv in PlaidEnvironments) {
  plaidEnv = rawEnv as keyof typeof PlaidEnvironments;
} else {
  const supported = Object.keys(PlaidEnvironments).join(", ");
  console.warn(
    `[plaid] Invalid PLAID_ENV="${rawEnv}". Supported: ${supported}. ` +
      `Falling back to "sandbox". (Note: "development" was deprecated — use "production".)`
  );
  plaidEnv = "sandbox";
}

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
