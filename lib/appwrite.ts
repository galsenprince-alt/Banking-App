"use server";

import { Client, Account, Databases, Users } from "node-appwrite";
import { cookies } from "next/headers";

const {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT: PROJECT_ID,
  APPWRITE_SECRET: API_KEY,
} = process.env;

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(ENDPOINT!)
    .setProject(PROJECT_ID!);

  const session = (await cookies()).get("my_appwrite_session");
  if (!session?.value) throw new Error("No session");

  client.setSession(session.value);

  return {
    get account() { return new Account(client); },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(ENDPOINT!)
    .setProject(PROJECT_ID!)
    .setKey(API_KEY!);

  return {
    get account() { return new Account(client); },
    get database() { return new Databases(client); },
    get user() { return new Users(client); },
  };
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}
