import { beforeEach, expect, it, vi } from "vitest";
import { birthdayVariants, nextBirthdayFor } from "./birthday";

const mocks = vi.hoisted(() => ({
  people: vi.fn(), rules: vi.fn(), channels: vi.fn(), create: vi.fn(), update: vi.fn(), send: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: {
  person: { findMany: mocks.people }, reminderRule: { findMany: mocks.rules },
  notificationChannel: { findMany: mocks.channels }, notificationDelivery: { create: mocks.create, update: mocks.update },
} }));
vi.mock("@/lib/notifications", () => ({ sendNotification: mocks.send }));
import { dispatchReminders } from "./dispatch";

const person = { id: 1n, name: "测试", calendar: "BOTH" as const, solarBirthDate: "1994-08-29", birthYear: 1994, birthMonth: 8, birthDay: 29, isLeapMonth: false, relation: null, note: null, enabled: true, rules: [] };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.people.mockResolvedValue([person]);
  mocks.rules.mockResolvedValue([{ id: 1n, daysBefore: 0 }]);
  mocks.channels.mockResolvedValue([{ id: 1n }]);
  mocks.create.mockResolvedValue({ id: 1n });
  mocks.update.mockResolvedValue({});
  mocks.send.mockResolvedValue(undefined);
});
it("sends independently on both solar and lunar birthdays", async () => {
  const variants = birthdayVariants({ ...person, id: "1" });
  for (const variant of variants) {
    const date = nextBirthdayFor(variant, new Date(2026, 0, 1));
    expect((await dispatchReminders(date)).sent).toBe(1);
  }
  expect(mocks.send).toHaveBeenCalledTimes(2);
  expect(mocks.send.mock.calls[0][1]).toContain("公历");
  expect(mocks.send.mock.calls[1][1]).toContain("农历");
});
it("combines coincident dates into one notification", async () => {
  expect((await dispatchReminders(new Date(1994, 7, 29))).sent).toBe(1);
  expect(mocks.send.mock.calls[0][1]).toContain("公历 / 农历");
});
it("stays silent when no birthday matches", async () => {
  expect((await dispatchReminders(new Date(2026, 0, 1))).sent).toBe(0);
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.send).not.toHaveBeenCalled();
});
