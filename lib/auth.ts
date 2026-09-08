import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as oidc from "openid-client";
import { db } from "@/lib/db";
export { digest, safeReturnTo, sessionToken } from "@/lib/auth-utils";
import { digest } from "@/lib/auth-utils";
import { renewCentralSession } from "@/lib/central-session";

export const SESSION_COOKIE = "bday_session";
export const STATE_COOKIE = "bday_oidc_state";
export const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
export const ATTEMPT_LIFETIME_MS = 10 * 60 * 1000;

export type AuthUser = { subject: string; username: string };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function appUrl() {
  return required("APP_URL").replace(/\/$/, "");
}

export function oidcClientId() {
  return required("OIDC_CLIENT_ID");
}

let configuration: Promise<oidc.Configuration> | undefined;

export function oidcConfig() {
  configuration ??= oidc.discovery(
    new URL(required("OIDC_ISSUER")),
    oidcClientId(),
    required("OIDC_CLIENT_SECRET"),
  );
  return configuration;
}

export function secureCookie() {
  return appUrl().startsWith("https://");
}

export async function currentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.authSession.findUnique({ where: { tokenHash: digest(token) } });
  if (!session || !session.oidcSid || session.expiresAt <= new Date()) return null;
  if (process.env.OIDC_SESSION_ENFORCED === "true") {
    if (!session.oidcRefreshToken) return null;
    if (!session.oidcCheckedAt || Date.now() - session.oidcCheckedAt.getTime() >= 60000) {
      const next = await renewCentralSession(session.oidcRefreshToken);
      const where = {tokenHash: session.tokenHash, oidcRefreshToken: session.oidcRefreshToken};
      if (!next) { await db.authSession.deleteMany({where}); return null; }
      const updated = await db.authSession.updateMany({where, data: {oidcRefreshToken: next, oidcCheckedAt: new Date()}});
      if (!updated.count) {
        const latest = await db.authSession.findUnique({where: {tokenHash: session.tokenHash}});
        if (!latest?.oidcCheckedAt || Date.now() - latest.oidcCheckedAt.getTime() >= 60000) return null;
      } // Concurrent logout cannot be undone by renewal.
    }
  }
  return { subject: session.subject, username: session.username };
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/api/auth/login");
  return user;
}
