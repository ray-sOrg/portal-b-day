export type CalendarKind = "SOLAR" | "LUNAR";

export type PersonView = {
  id: string;
  name: string;
  relation: string | null;
  calendar: CalendarKind;
  birthYear: number | null;
  birthMonth: number;
  birthDay: number;
  isLeapMonth: boolean;
  note: string | null;
  enabled: boolean;
};

export type UpcomingBirthday = PersonView & {
  nextBirthday: Date;
  daysUntil: number;
  age: number | null;
};
