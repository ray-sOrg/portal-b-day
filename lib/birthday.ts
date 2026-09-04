import { differenceInCalendarDays, startOfDay } from "date-fns";
import { Lunar } from "lunar-javascript";
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

export function nextBirthdayFor(person: PersonView, from = new Date()) {
  const today = startOfDay(from);
  const year = today.getFullYear();

  if (person.calendar === "SOLAR") {
    const thisYear = safeSolarDate(year, person.birthMonth, person.birthDay);
    return thisYear >= today ? thisYear : safeSolarDate(year + 1, person.birthMonth, person.birthDay);
  }

  const thisYear = lunarDateForYear(person, year);
  if (thisYear && thisYear >= today) return thisYear;
  return lunarDateForYear(person, year + 1) ?? safeSolarDate(year + 1, person.birthMonth, person.birthDay);
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
  const calendar = person.calendar === "LUNAR" ? "农历" : "公历";
  const leap = person.isLeapMonth ? "闰" : "";
  return `${calendar} ${leap}${person.birthMonth}月${person.birthDay}日`;
}
