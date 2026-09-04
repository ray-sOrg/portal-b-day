import { Solar } from "lunar-javascript";

// The original Gregorian date is canonical. Lunar birthdays are always derived
// from the birth year, never from the current year.
export function convertBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("请输入完整的公历出生日期");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || year > 2100 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("请输入 1900—2100 年之间的有效日期");
  }
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  return {
    solar: { year, month, day },
    lunar: { year: lunar.getYear(), month: Math.abs(lunar.getMonth()), day: lunar.getDay(), isLeapMonth: lunar.getMonth() < 0 },
  };
}

export function dualBirthdayLabel(value: string) {
  const { solar, lunar } = convertBirthDate(value);
  return `公历 ${solar.month}月${solar.day}日 · 农历 ${lunar.isLeapMonth ? "闰" : ""}${lunar.month}月${lunar.day}日`;
}
