import { afterEach, expect, it, vi } from "vitest";
import { sealRefreshToken, openRefreshToken, renewCentralSession } from "./central-session";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function setup() {
  vi.stubEnv("OIDC_CLIENT_SECRET", "test-secret");
  vi.stubEnv("OIDC_CLIENT_ID", "test-client");
  vi.stubEnv("OIDC_ISSUER", "https://auth.invalid/realms/test");
}
it("encrypts and authenticates refresh credentials", () => {
  setup();
  const encrypted = sealRefreshToken("private-token");
  expect(encrypted).not.toContain("private-token");
  expect(openRefreshToken(encrypted)).toBe("private-token");
  expect(() => openRefreshToken("broken")).toThrow();
});
it("distinguishes invalid sessions from provider outages", async () => {
  setup();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({status:400,ok:false,json:async()=>({error:"invalid_grant"})}));
  expect(await renewCentralSession(sealRefreshToken("rt"))).toBeNull();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({status:503,ok:false,json:async()=>({error:"unavailable"})}));
  await expect(renewCentralSession(sealRefreshToken("rt"))).rejects.toThrow();
});
it("keeps renewed credentials encrypted", async () => {
  setup();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({status:200,ok:true,json:async()=>({refresh_token:"next"})}));
  expect(openRefreshToken((await renewCentralSession(sealRefreshToken("rt")))!)).toBe("next");
});

