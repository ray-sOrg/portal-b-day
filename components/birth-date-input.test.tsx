// @vitest-environment jsdom
import React, { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BirthDateInput } from "./birth-date-input";

afterEach(cleanup);
function Fixture({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <form aria-label="生日表单"><BirthDateInput value={value} onChange={setValue} required /></form>;
}
it("accepts compact pasted dates and previews the birth-year lunar date", () => {
  render(<Fixture />);
  fireEvent.change(screen.getByLabelText("公历出生日期"), { target: { value: "19940829" } });
  expect((screen.getByLabelText("公历出生日期") as HTMLInputElement).value).toBe("1994-08-29");
  expect(screen.getByText("公历 8月29日 · 农历 7月23日")).toBeTruthy();
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("solarBirthDate")).toBe("1994-08-29");
});
it("does not rewrite a partially typed day before the user finishes", () => {
  render(<Fixture />);
  const input = screen.getByLabelText("公历出生日期") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "1994-08-2" } });
  expect(input.value).toBe("1994-08-2");
  fireEvent.change(input, { target: { value: "1994-08-29" } });
  expect(input.value).toBe("1994-08-29");
});
it("blocks impossible dates and clears without leaving a stale saved date", () => {
  render(<Fixture initial="1994-08-29" />);
  const input = screen.getByLabelText("公历出生日期") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "1994-02-29" } });
  fireEvent.blur(input);
  expect(input.checkValidity()).toBe(false);
  expect(input.getAttribute("aria-invalid")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "清空出生日期" }));
  expect(input.value).toBe("");
  expect(input.validity.customError).toBe(false);
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("solarBirthDate")).toBe("");
});
it("jumps through year/month dropdowns and Escape closes only the calendar", () => {
  render(<Fixture initial="1994-08-29" />);
  const trigger = screen.getByRole("button", { name: "选择出生日期" });
  fireEvent.click(trigger);
  expect((screen.getByRole("combobox", { name: "年份" }) as HTMLSelectElement).value).toBe("1994");
  fireEvent.change(screen.getByRole("combobox", { name: "年份" }), { target: { value: "1960" } });
  fireEvent.change(screen.getByRole("combobox", { name: "月份" }), { target: { value: "0" } });
  expect((screen.getByRole("combobox", { name: "年份" }) as HTMLSelectElement).value).toBe("1960");
  fireEvent.keyDown(screen.getByRole("group", { name: "出生日期日历" }), { key: "Escape" });
  expect(screen.queryByRole("group", { name: "出生日期日历" })).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
it("fills the chosen calendar day and returns focus to the trigger", () => {
  render(<Fixture initial="1994-08-29" />);
  const trigger = screen.getByRole("button", { name: "选择出生日期" });
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "1994年8月15日 星期一" }));
  expect((screen.getByLabelText("公历出生日期") as HTMLInputElement).value).toBe("1994-08-15");
  expect(screen.queryByRole("group", { name: "出生日期日历" })).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
