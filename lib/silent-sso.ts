import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

// No credentials leave the server. The parent only learns whether to reload.
export function silentResult(authenticated: boolean, origin: string) {
  const nonce = randomBytes(18).toString("base64");
  return new NextResponse(`<!doctype html><meta charset="utf-8"><script nonce="${nonce}">parent.postMessage({type:"tt829:sso",authenticated:${authenticated}},${JSON.stringify(origin)});</script>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors ${origin}`,
    },
  });
}

