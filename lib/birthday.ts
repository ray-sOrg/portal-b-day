import { differenceInCalendarDays, startOfDay } from "date-fns";
import { Lunar } from "lunar-javascript";
import { convertBirthDate, dualBirthdayLabel } from "./birth-date";
import type { PersonView, UpcomingBirthday } from "@/lib/types";

function safeSolarDate(year: number, month: number, day: number) {
  const normalizedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return new Date(year, month - 1, normalizedDay);
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function lunarDateForYear(person: PersonView, lunarYear: number) {
  try {
    const lunarMonth = person.isLeapMonth ? -person.birthMonth : person.birthMonth;
    const solar = Lunar.fromYmd(lunarYear, lunarMonth, person.birthDay).getSolar();
    return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
  } catch {
    return null;
  }
}

export function nextBirthdayFor(person: PersonView, from = new Date()): Date {
  if (person.calendar === "BOTH") {
    const dates = birthdayVariants(person).map((variant) => nextBirthdayFor(variant, from));
    return new Date(Math.min(...dates.map((date) => date.getTime())));
  }
  const today = startOfDay(from);
  const year = today.getFullYear();

  if (person.calendar === "SOLAR") {
    const thisYear = safeSolarDate(year, person.birthMonth, person.birthDay);
    return thisYear >= today ? thisYear : safeSolarDate(year + 1, person.birthMonth, person.birthDay);
  }

  // Lunar year can lag Gregorian year in January/February.
  for (let lunarYear = year - 1; lunarYear <= year + 20; lunarYear++) {
    const occurrence = lunarDateForYear(person, lunarYear);
    if (occurrence && occurrence >= today) return occurrence;
  }
  throw new Error("未找到有效的农历生日，请检查日期和闰月设置");
}

export function birthdayVariants(person: PersonView): PersonView[] {
  if (person.calendar !== "BOTH") return [person];
  if (!person.solarBirthDate) throw new Error("双历提醒缺少公历出生日期");
  const { solar, lunar } = convertBirthDate(person.solarBirthDate);
  return [
    { ...person, calendar: "SOLAR", birthYear: solar.year, birthMonth: solar.month, birthDay: solar.day, isLeapMonth: false },
    { ...person, calendar: "LUNAR", birthYear: lunar.year, birthMonth: lunar.month, birthDay: lunar.day, isLeapMonth: lunar.isLeapMonth },
  ];
}

export function withUpcoming(person: PersonView, from = new Date()): UpcomingBirthday {
  const nextBirthday = nextBirthdayFor(person, from);
  return {
    ...person,
    nextBirthday,
    daysUntil: differenceInCalendarDays(nextBirthday, startOfDay(from)),
    age: person.birthYear ? nextBirthday.getFullYear() - person.birthYear : null,
  };
}

export function sortUpcoming(people: PersonView[], from = new Date()) {
  return people.map((person) => withUpcoming(person, from)).sort((a, b) => a.daysUntil - b.daysUntil);
}

export function birthdayLabel(person: PersonView) {
  if (person.solarBirthDate) return dualBirthdayLabel(person.solarBirthDate);
  const calendar = person.calendar === "LUNAR" ? "农历" : "公历";
  const leap = person.isLeapMonth ? "闰" : "";
  return `${calendar} ${leap}${person.birthMonth}月${person.birthDay}日`;
}
