import { compare, hash } from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../drizzle/schema";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
import { ENV } from "./_core/env";

export const LOCAL_SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const PASSWORD_WORK_FACTOR = 12;
const DEVELOPMENT_SESSION_SECRET = "qrserve-development-session-secret-not-for-production";

type HeaderCarrier = { headers?: Record<string, string | string[] | undefined> };
type CredentialSession = { uid: number; kind: "qrserve-password" };
type LegacySession = { openId: string; appId: string };

function sessionKey() {
  if (ENV.cookieSecret.length >= 32) return new TextEncoder().encode(ENV.cookieSecret);
  if (ENV.isProduction) throw new Error("JWT_SECRET must be at least 32 characters in production.");
  return new TextEncoder().encode(DEVELOPMENT_SESSION_SECRET);
}

function getHeader(req: HeaderCarrier, name: string) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  return hash(password, PASSWORD_WORK_FACTOR);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function createCredentialSession(userId: number) {
  return new SignJWT({ uid: userId, kind: "qrserve-password" satisfies CredentialSession["kind"] })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + LOCAL_SESSION_MAX_AGE_MS) / 1000))
    .sign(sessionKey());
}

export async function getCredentialSessionUser(req: HeaderCarrier): Promise<User | null> {
  const rawCookie = getHeader(req, "cookie");
  const token = rawCookie ? parseCookieHeader(rawCookie)[COOKIE_NAME] : undefined;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    if (payload.kind !== "qrserve-password" || typeof payload.uid !== "number" || !Number.isInteger(payload.uid)) return null;
    return (await db.getUserById(payload.uid)) ?? null;
  } catch {
    return null;
  }
}

export async function getLegacySessionOpenId(req: HeaderCarrier): Promise<string | null> {
  const rawCookie = getHeader(req, "cookie");
  const token = rawCookie ? parseCookieHeader(rawCookie)[COOKIE_NAME] : undefined;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    const legacy = payload as LegacySession;
    return typeof legacy.openId === "string" && legacy.openId.length > 0 && typeof legacy.appId === "string" && legacy.appId.length > 0 ? legacy.openId : null;
  } catch {
    return null;
  }
}

export function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
