import { expect, it } from "vitest";
import { convertBirthDate, convertLunarBirthDate } from "./birth-date";
import { personSchema } from "./validation";
import { birthdayVariants, nextBirthdayFor } from "./birthday";
it("converts the original birth date rather than this year's birthday", () => {
  expect(convertBirthDate("1994-08-29").lunar).toEqual({year:1994,month:7,day:23,isLeapMonth:false});
});
it("rejects invalid dates", () => {
  expect(() => convertBirthDate("1994-02-29")).toThrow();
  expect(() => convertBirthDate("2024-04-31")).toThrow();
});
it("converts an entered lunar date to its canonical Gregorian date", () => {
  expect(convertLunarBirthDate("1968-12-27")).toEqual({
    solar: {year:1969,month:2,day:13},
    lunar: {year:1968,month:12,day:27,isLeapMonth:false},
  });
  expect(() => convertLunarBirthDate("2023-03-01", true)).toThrow("没有这个闰月");
});
it("recomputes fields server-side and retains both calendars", () => {
  const parsed = personSchema.parse({name:"测试",calendar:"BOTH",solarBirthDate:"1994-08-29",birthMonth:1,birthDay:1,birthYear:"",enabled:"true"});
  expect(parsed.birthMonth).toBe(8);
  const person = {...parsed,id:"test",birthYear:1994,relation:null,note:null};
  const [solar,lunar] = birthdayVariants(person);
  expect([lunar.birthMonth,lunar.birthDay]).toEqual([7,23]);
  expect(nextBirthdayFor(solar,new Date(2026,0,1))).toEqual(new Date(2026,7,29));
  expect(nextBirthdayFor(lunar,new Date(2026,0,1))).not.toEqual(nextBirthdayFor(solar,new Date(2026,0,1)));
});
it("accepts lunar input and stores the canonical Gregorian date", () => {
  const parsed = personSchema.parse({
    name:"长辈", calendar:"BOTH", birthDate:"1968-12-27", birthDateCalendar:"LUNAR",
    birthMonth:1, birthDay:1, birthYear:"", enabled:"true",
  });
  expect(parsed.solarBirthDate).toBe("1969-02-13");
  expect([parsed.birthYear, parsed.birthMonth, parsed.birthDay]).toEqual([1969,2,13]);
});
it("requires a complete date for both calendars", () => {
  expect(personSchema.safeParse({name:"测试",calendar:"BOTH",birthMonth:8,birthDay:29}).success).toBe(false);
});
