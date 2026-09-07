// @vitest-environment node
import {describe, it, expect} from "vitest";
import {generateKeyPair, SignJWT} from "jose";
import {verifyLogoutToken} from "./oidc-logout";

describe("signed logout notifications", () => {
  it("accepts a scoped logout and rejects identity tokens, forged tokens and invalid claims", async () => {
    const {privateKey, publicKey} = await generateKeyPair("RS256");
    const other = await generateKeyPair("RS256");
    const issuer = "https://auth.example/realms/test";
    const now = Math.floor(Date.now()/1000);
    const claims = {iss: issuer, aud: "test-client", iat: now, exp: now+120, jti: "event-1",
      sid: "browser-a", sub: "user-1", events: {"http://schemas.openid.net/event/backchannel-logout": {}}};
    const sign = (value: object, key = privateKey) => new SignJWT({...value}).setProtectedHeader({alg:"RS256"}).sign(key);
    expect(await verifyLogoutToken(await sign(claims), issuer, "test-client", async () => publicKey))
      .toEqual({sid:"browser-a",sub:"user-1"});
    for (const change of [{nonce:"unexpected"}, {sid:""}, {events:{}}, {aud:"wrong"},
      {iss:"https://wrong"}, {exp:now-1}, {iat:now-600}, {jti:""}]) {
      await expect(verifyLogoutToken(await sign({...claims,...change}), issuer, "test-client", async () => publicKey)).rejects.toThrow();
    }
    await expect(verifyLogoutToken(await sign(claims, other.privateKey), issuer, "test-client", async () => publicKey)).rejects.toThrow();
  });
});

