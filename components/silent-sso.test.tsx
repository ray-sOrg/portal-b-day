// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SilentSso } from "./silent-sso";

beforeEach(() => { vi.stubGlobal("React", React); sessionStorage.clear(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it("does not check when already authenticated", () => {
  render(<SilentSso loginUrl="/api/auth/login?silent=1" enabled={false} />);
  expect(document.querySelector("iframe")).toBeNull();
});

it("ignores messages from other origins and windows, accepting only its own frame", () => {
  render(<SilentSso loginUrl="/api/auth/login?silent=1" />);
  const frame = document.querySelector("iframe")!;
  expect(frame.hidden).toBe(true);
  const data = { type: "tt829:sso", authenticated: false };
  window.dispatchEvent(new MessageEvent("message", { origin: "https://evil.invalid", source: frame.contentWindow, data }));
  expect(frame.isConnected).toBe(true);
  window.dispatchEvent(new MessageEvent("message", { origin: window.location.origin, source: window, data }));
  expect(frame.isConnected).toBe(true);
  window.dispatchEvent(new MessageEvent("message", { origin: window.location.origin, source: frame.contentWindow, data }));
  expect(frame.isConnected).toBe(false);
});

it("stops quietly on timeout and avoids immediate reload loops", () => {
  vi.useFakeTimers();
  const view = render(<SilentSso loginUrl="/api/auth/login?silent=1" />);
  vi.advanceTimersByTime(20000);
  expect(document.querySelector("iframe")).toBeNull();
  view.unmount();
  sessionStorage.setItem("tt829:sso-reload:" + window.location.origin, String(Date.now()));
  render(<SilentSso loginUrl="/api/auth/login?silent=1" />);
  expect(document.querySelector("iframe")).toBeNull();
});
