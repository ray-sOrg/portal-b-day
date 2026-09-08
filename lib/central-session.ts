import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  if (!process.env.OIDC_CLIENT_SECRET) throw new Error("Missing OIDC client secret");
  return createHash("sha256").update("central-session-v1:" + process.env.OIDC_CLIENT_SECRET).digest();
}

export function sealRefreshToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

export function openRefreshToken(token: string) {
  const data = Buffer.from(token, "base64");
  const cipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  cipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString("utf8");
}

// null means an authoritative invalid_grant. All other failures remain errors.
export async function renewCentralSession(encrypted: string): Promise<string | null> {
  const response = await fetch(process.env.OIDC_ISSUER!.replace(/\/$/, "") + "/protocol/openid-connect/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({grant_type: "refresh_token", refresh_token: openRefreshToken(encrypted),
      client_id: process.env.OIDC_CLIENT_ID!, client_secret: process.env.OIDC_CLIENT_SECRET!}),
  });
  const result = await response.json();
  if (response.status === 400 && result.error === "invalid_grant") return null;
  if (!response.ok || typeof result.refresh_token !== "string") throw new Error("Central authentication temporarily unavailable");
  return sealRefreshToken(result.refresh_token);
}

