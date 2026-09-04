import { expect, it } from "vitest";
import { dateInputToDate, normalizeDateInput } from "./date-input";

it.each(["19940829", "1994-08-29", "1994/8/29", "1994.8.29", "1994年8月29日", " 19940829 "])("normalizes %s", (value) => {
  expect(normalizeDateInput(value)).toBe("1994-08-29");
});
it.each(["", "1994", "1994-02-29", "2024-04-31", "2024-13-01", "1899-12-31", "2101-01-01", "199408290"])("rejects %s", (value) => {
  expect(normalizeDateInput(value)).toBeNull();
});
it("supports leap days and local calendar dates without timezone shifts", () => {
  expect(normalizeDateInput("20000229")).toBe("2000-02-29");
  expect(dateInputToDate("19940829")).toEqual(new Date(1994, 7, 29));
});
