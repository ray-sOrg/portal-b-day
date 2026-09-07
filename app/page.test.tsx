import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { currentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import Home from "./page";

vi.mock("@/lib/auth", () => ({ currentUser: vi.fn() }));
vi.mock("@/lib/data", () => ({ getDashboardData: vi.fn() }));
vi.mock("@/app/actions", () => ({ deletePerson: vi.fn(), deleteRule: vi.fn(), toggleChannel: vi.fn(), togglePerson: vi.fn() }));
vi.mock("@/components/person-form", () => ({ PersonForm: () => null }));
vi.mock("@/components/settings-forms", () => ({ AddChannelForm: () => null, AddRuleForm: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("React", React);
});
afterEach(() => vi.unstubAllGlobals());

it("shows an explicit login link without loading private data for a visitor", async () => {
  vi.mocked(currentUser).mockResolvedValue(null);
  const html = renderToStaticMarkup(await Home());
  expect(html).toContain('href="/api/auth/login"');
  expect(html).toContain("使用统一账号登录");
  expect(html).not.toContain("完整生日簿");
  expect(html).not.toContain('http-equiv="refresh"');
  expect(getDashboardData).not.toHaveBeenCalled();
});

it("keeps the birthday dashboard for an authenticated user", async () => {
  vi.mocked(currentUser).mockResolvedValue({ subject: "test-subject", username: "test-user" });
  vi.mocked(getDashboardData).mockResolvedValue({ people: [], rules: [], channels: [], deliveries: [] });
  const html = renderToStaticMarkup(await Home());
  expect(html).toContain("完整生日簿");
  expect(html).toContain("test-user");
  expect(html).not.toContain("使用统一账号登录");
  expect(getDashboardData).toHaveBeenCalledOnce();
});
