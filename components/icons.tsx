import { BellRing, CalendarDays, CakeSlice, Settings2, UsersRound } from "lucide-react";

export const navItems = [
  { href: "#today", label: "今日", icon: CalendarDays },
  { href: "#birthdays", label: "生日簿", icon: UsersRound },
  { href: "#reminders", label: "提醒", icon: BellRing },
  { href: "#settings", label: "设置", icon: Settings2 },
] as const;

export { CakeSlice };
