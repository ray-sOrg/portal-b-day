import { expect, it } from "vitest";
import { convertBirthDate } from "./birth-date";
import { personSchema } from "./validation";
import { birthdayVariants, nextBirthdayFor } from "./birthday";
it("converts the original birth date rather than this year's birthday", () => {
  expect(convertBirthDate("1994-08-29").lunar).toEqual({year:1994,month:7,day:23,isLeapMonth:false});
});
it("rejects invalid dates", () => {
  expect(() => convertBirthDate("1994-02-29")).toThrow();
  expect(() => convertBirthDate("2024-04-31")).toThrow();
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
it("requires a complete date for both calendars", () => {
  expect(personSchema.safeParse({name:"测试",calendar:"BOTH",birthMonth:8,birthDay:29}).success).toBe(false);
});
