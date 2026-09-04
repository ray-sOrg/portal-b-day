import { createHash, randomBytes } from "node:crypto";

export function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 500);
}

export function sessionToken() {
  return randomBytes(32).toString("base64url");
}

