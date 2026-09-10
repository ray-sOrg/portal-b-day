import { Lunar, Solar } from "lunar-javascript";
import { normalizeDateInput, normalizeDateParts } from "./date-input";

export type BirthDateCalendar = "SOLAR" | "LUNAR";

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

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

export function convertLunarBirthDate(value: string, isLeapMonth = false) {
  const normalized = normalizeDateParts(value);
  if (!normalized) throw new Error("请输入 1900—2100 年之间的完整农历日期");
  const [year, month, day] = normalized.split("-").map(Number);

  try {
    const lunar = Lunar.fromYmd(year, isLeapMonth ? -month : month, day);
    const solar = lunar.getSolar();
    const solarYear = solar.getYear();
    if (solarYear < 1900 || solarYear > 2100) throw new Error("converted date is out of range");
    return {
      solar: { year: solarYear, month: solar.getMonth(), day: solar.getDay() },
      lunar: { year, month, day, isLeapMonth },
    };
  } catch {
    throw new Error(isLeapMonth ? "该年份没有这个闰月，或农历日期无效" : "请输入有效的农历日期");
  }
}

export function normalizeLunarDateInput(value: string, isLeapMonth = false): string | null {
  const normalized = normalizeDateParts(value);
  if (!normalized) return null;
  try {
    convertLunarBirthDate(normalized, isLeapMonth);
    return normalized;
  } catch {
    return null;
  }
}

export function convertEnteredBirthDate(value: string, calendar: BirthDateCalendar, isLeapMonth = false) {
  if (calendar === "LUNAR") return convertLunarBirthDate(value, isLeapMonth);
  const normalized = normalizeDateInput(value);
  if (!normalized) throw new Error("请输入 1900—2100 年之间的有效公历日期");
  return convertBirthDate(normalized);
}

export function birthDateValueForCalendar(
  converted: ReturnType<typeof convertBirthDate>,
  calendar: BirthDateCalendar,
) {
  const date = calendar === "SOLAR" ? converted.solar : converted.lunar;
  return ymd(date.year, date.month, date.day);
}

export function canonicalSolarBirthDate(converted: ReturnType<typeof convertBirthDate>) {
  return ymd(converted.solar.year, converted.solar.month, converted.solar.day);
}

export function birthDateConversionLabel(converted: ReturnType<typeof convertBirthDate>) {
  const { solar, lunar } = converted;
  return `公历 ${solar.year}年${solar.month}月${solar.day}日 · 农历 ${lunar.year}年${lunar.isLeapMonth ? "闰" : ""}${lunar.month}月${lunar.day}日`;
}

export function dualBirthdayLabel(value: string) {
  const { solar, lunar } = convertBirthDate(value);
  return `公历 ${solar.month}月${solar.day}日 · 农历 ${lunar.isLeapMonth ? "闰" : ""}${lunar.month}月${lunar.day}日`;
}
