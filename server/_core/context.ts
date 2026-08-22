import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getCredentialSessionUser, getLegacySessionOpenId } from "../localAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  legacyOpenId?: string | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let legacyOpenId: string | null = null;

  try {
    user = await getCredentialSessionUser(opts.req);
    if (!user) legacyOpenId = await getLegacySessionOpenId(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
    legacyOpenId = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    legacyOpenId,
  };
}
