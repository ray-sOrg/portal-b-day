import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

const EVENT = "http://schemas.openid.net/event/backchannel-logout";
let keys: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function verifyLogoutToken(token: string, issuer: string, audience: string, key?: JWTVerifyGetKey) {
  if (!token || token.length > 16384) throw new Error("Invalid logout token");
  keys ??= createRemoteJWKSet(new URL(issuer.replace(/\/$/, "") + "/protocol/openid-connect/certs"));
  const {payload} = await jwtVerify(token, key ?? keys, {
    issuer, audience, algorithms: ["RS256"], maxTokenAge: "5m",
    requiredClaims: ["iss", "aud", "iat", "exp", "jti", "sid", "events"],
  });
  if ("nonce" in payload || typeof payload.sid !== "string" || !payload.sid ||
      typeof payload.jti !== "string" || !payload.jti) throw new Error("Invalid logout claims");
  const events = payload.events;
  if (!events || typeof events !== "object" || Array.isArray(events)) throw new Error("Missing logout event");
  const event = (events as Record<string, unknown>)[EVENT];
  if (!event || typeof event !== "object" || Array.isArray(event) || Object.keys(event).length) throw new Error("Invalid logout event");
  return {sid: payload.sid, sub: payload.sub};
}

