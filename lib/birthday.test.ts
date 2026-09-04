import { describe, expect, it } from "vitest";
import { nextBirthdayFor, sortUpcoming } from "./birthday";
import type { PersonView } from "./types";

const base: PersonView = {
  id: "1", name: "测试", relation: null, calendar: "SOLAR", birthYear: null,
  birthMonth: 9, birthDay: 18, isLeapMonth: false, note: null, enabled: true,
};

describe("birthday calculation", () => {
  it("keeps this year's birthday when it has not passed", () => {
    expect(nextBirthdayFor(base, new Date(2026, 8, 4))).toEqual(new Date(2026, 8, 18));
  });

  it("rolls a past birthday into next year", () => {
    expect(nextBirthdayFor(base, new Date(2026, 9, 1))).toEqual(new Date(2027, 8, 18));
  });

  it("observes a leap-day birthday on February 28 in common years", () => {
    expect(nextBirthdayFor({ ...base, birthMonth: 2, birthDay: 29 }, new Date(2027, 0, 1))).toEqual(new Date(2027, 1, 28));
  });

  it("sorts people by the next occurrence", () => {
    const people = [base, { ...base, id: "2", name: "更近", birthDay: 8 }];
    expect(sortUpcoming(people, new Date(2026, 8, 4)).map((item) => item.name)).toEqual(["更近", "测试"]);
  });
});
