# M$F Banking

A full-stack mobile banking web application built with Next.js 16, React 19, and TypeScript. Supports multi-bank account linking via Plaid, bank-to-bank transfers via Stripe (ACSS debit for Canada), and real-time transaction history.

## Features

- **Authentication** — Secure sign-up / sign-in with Appwrite (HTTP-only session cookie)
- **Bank linking** — Connect Canadian & US bank accounts via Plaid Link
- **Dashboard** — Live balances, spending breakdown, recent transactions
- **Transfers** — Bank-to-bank transfers via Stripe PaymentIntents (acss_debit)
- **Security** — AES-256-GCM encryption for stored Plaid access tokens and SSN/SIN; route protection at both middleware and layout level

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| Auth & DB | Appwrite (Cloud) |
| Bank linking | Plaid |
| Payments | Stripe (acss_debit — Canadian banks) |
| Error tracking | Sentry |
| Language | TypeScript 5 |

## Setup

### 1. Prerequisites

- Node.js 20+
- Appwrite Cloud project with 4 collections: `users`, `banks`, `transactions`
- Plaid developer account (sandbox mode works)
- Stripe account

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in each value:

```bash
cp .env.example .env.local
```

Generate the encryption key:

```bash
openssl rand -hex 32
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Appwrite collections

| Collection | Env var | Required fields |
|---|---|---|
| users | `APPWRITE_USER_COLLECTION_ID` | userId, email, firstName, lastName, address1, city, state, postalCode, dateOfBirth, ssn, stripeCustomerId |
| banks | `APPWRITE_BANK_COLLECTION_ID` | userId, bankId, accountId, accessToken, fundingSourceUrl, sharableId |
| transactions | `APPWRITE_TRANSACTION_COLLECTION_ID` | name, amount, senderId, senderBankId, receiverId, receiverBankId, email, channel, category |

## Architecture notes

- `lib/appwrite.ts` — Appwrite client factory (session + admin). All data access goes through `lib/actions/`.
- `lib/actions/user.actions.ts` — Auth, bank CRUD, Plaid token exchange. Encrypts `accessToken` and `ssn` at rest.
- `lib/actions/stripe.actions.ts` — Stripe customer creation, bank account linking (acss_debit PaymentMethod), transfers (PaymentIntents).
- `lib/crypto.ts` — AES-256-GCM field-level encryption/decryption.
- Route protection: `proxy.ts` (middleware level) + `app/(root)/layout.tsx` (layout level).
