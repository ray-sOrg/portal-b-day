import { NextRequest, NextResponse } from "next/server";
import * as oidc from "openid-client";
import {
  ATTEMPT_LIFETIME_MS,
  STATE_COOKIE,
  appUrl,
  digest,
  oidcConfig,
  safeReturnTo,
  secureCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const config = await oidcConfig();
  const silent = request.nextUrl.searchParams.get("silent") === "1";
  const state = (silent ? "silent." : "") + oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const expiresAt = new Date(Date.now() + ATTEMPT_LIFETIME_MS);
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  await db.$transaction([
    db.authAttempt.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    db.authAttempt.create({
      data: { stateHash: digest(state), codeVerifier, nonce, returnTo, expiresAt },
    }),
  ]);

  const authorizationUrl = oidc.buildAuthorizationUrl(config, {
    redirect_uri: `${appUrl()}/api/auth/callback`,
    scope: "openid profile email",
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    ...(silent ? { prompt: "none" } : {}),
  });
  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(STATE_COOKIE + (silent ? "_silent" : ""), state, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "lax",
    path: "/api/auth/callback",
    expires: expiresAt,
  });
  return response;
}
