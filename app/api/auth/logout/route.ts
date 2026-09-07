import { NextRequest, NextResponse } from "next/server";
import * as oidc from "openid-client";
import {
  SESSION_COOKIE,
  appUrl,
  digest,
  oidcClientId,
  oidcConfig,
} from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== appUrl()) return new NextResponse('Forbidden', {status: 403});
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await db.authSession.deleteMany({ where: { tokenHash: digest(token) } });
  const config = await oidcConfig();
  const logoutUrl = oidc.buildEndSessionUrl(config, {
    client_id: oidcClientId(),
    post_logout_redirect_uri: appUrl(),
  });
  const response = NextResponse.redirect(logoutUrl, 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
