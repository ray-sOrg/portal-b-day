import { afterEach, expect, it, vi } from "vitest";
import { sendWecomApp } from "./wecom-app";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function setup() {
  vi.stubEnv("WECOM_CORP_ID", "test"); vi.stubEnv("WECOM_APP_SECRET", "test-secret");
  vi.stubEnv("WECOM_AGENT_ID", "1000005"); vi.stubEnv("WECOM_TO_USER", "one|two");
}
it("sends only to configured users and detects partial failure", async () => {
  setup();
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ errcode: 0, access_token: "token", expires_in: 0 }))
    .mockResolvedValueOnce(Response.json({ errcode: 0, invaliduser: "two" }));
  vi.stubGlobal("fetch", fetcher);
  await expect(sendWecomApp("test")).rejects.toThrow("部分接收人");
  expect(JSON.parse(fetcher.mock.calls[1][1].body).touser).toBe("one|two");
});
it("redacts transport errors", async () => {
  setup(); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret-bearing-url")));
  await expect(sendWecomApp("test")).rejects.toThrow("网络异常");
});
it("rejects broadcasts before sending", async () => {
  setup(); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  await expect(sendWecomApp("test", "@all")).rejects.toThrow("全员广播");
  expect(fetcher).not.toHaveBeenCalled();
});
