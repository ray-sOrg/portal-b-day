import { NextRequest, NextResponse } from "next/server";
import * as oidc from "openid-client";
import {
  SESSION_COOKIE,
  SESSION_LIFETIME_MS,
  STATE_COOKIE,
  appUrl,
  digest,
  oidcConfig,
  sessionToken,
  secureCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";

type RealmAccess = { roles?: unknown };

export async function GET(request: NextRequest) {
  const state = request.cookies.get(STATE_COOKIE)?.value;
  if (!state || request.nextUrl.searchParams.get("state") !== state) {
    return new NextResponse("登录状态无效，请重新登录。", { status: 400 });
  }

  const attempt = await db.authAttempt.findUnique({ where: { stateHash: digest(state) } });
  if (!attempt || attempt.expiresAt <= new Date()) {
    return new NextResponse("登录请求已过期，请重新登录。", { status: 400 });
  }

  try {
    const config = await oidcConfig();
    const callbackUrl = new URL(`${appUrl()}/api/auth/callback`);
    callbackUrl.search = request.nextUrl.search;
    const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: attempt.codeVerifier,
      expectedState: state,
      expectedNonce: attempt.nonce,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    const roles = (claims?.realm_access as RealmAccess | undefined)?.roles;
    if (!claims?.sub || !Array.isArray(roles) || !roles.includes("app-bday")) {
      await db.authAttempt.delete({ where: { stateHash: attempt.stateHash } });
      return NextResponse.redirect(new URL("/unauthorized", appUrl()));
    }

    const rawToken = sessionToken();
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    const username = String(claims.preferred_username ?? claims.email ?? claims.sub);
    await db.$transaction([
      db.authAttempt.delete({ where: { stateHash: attempt.stateHash } }),
      db.authSession.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
      db.authSession.create({
        data: { tokenHash: digest(rawToken), subject: claims.sub, username, expiresAt },
      }),
    ]);

    const response = NextResponse.redirect(new URL(attempt.returnTo, appUrl()));
    response.cookies.set(STATE_COOKIE, "", {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/api/auth/callback",
      maxAge: 0,
    });
    response.cookies.set(SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: secureCookie(),
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch {
    await db.authAttempt.deleteMany({ where: { stateHash: attempt.stateHash } });
    return new NextResponse("统一登录失败，请重试。", { status: 400 });
  }
}
