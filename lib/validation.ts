import { z } from "zod";
import { convertBirthDate } from "./birth-date";

const checkbox = z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional().transform(Boolean);

export const personSchema = z
  .object({
    id: z.string().regex(/^\d+$/).optional(),
    name: z.string().trim().min(1, "请填写姓名").max(80),
    relation: z.string().trim().max(40).optional().transform((value) => value || null),
    calendar: z.enum(["SOLAR", "LUNAR", "BOTH"]),
    solarBirthDate: z.string().optional().transform((value) => value?.trim() || null),
    birthYear: z.coerce.number().int().min(1900).max(2200).optional().or(z.literal("")),
    birthMonth: z.coerce.number().int().min(1).max(12),
    birthDay: z.coerce.number().int().min(1).max(31),
    isLeapMonth: checkbox,
    note: z.string().trim().max(500).optional().transform((value) => value || null),
    enabled: checkbox,
  })
  .refine((data) => data.calendar === "LUNAR" || !data.isLeapMonth, { message: "只有农历生日可以选择闰月" })
  .transform((data, ctx) => {
    if (data.calendar === "BOTH" && !data.solarBirthDate) {
      ctx.addIssue({code:"custom", message:"两种生日都提醒需要填写完整的公历出生日期"});
      return z.NEVER;
    }
    if (!data.solarBirthDate) return data;
    try {
      const { solar, lunar } = convertBirthDate(data.solarBirthDate);
      const selected = data.calendar === "LUNAR" ? lunar : solar;
      return { ...data, birthYear: selected.year, birthMonth: selected.month, birthDay: selected.day, isLeapMonth: data.calendar === "LUNAR" && lunar.isLeapMonth };
    } catch (error) {
      ctx.addIssue({code:"custom", message:error instanceof Error ? error.message : "出生日期无效"});
      return z.NEVER;
    }
  });

export const ruleSchema = z.object({ daysBefore: z.coerce.number().int().min(0).max(366) });

export const channelSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(["WECOM_BOT", "EMAIL"]),
  destination: z.string().trim().max(320).optional().transform((value) => value || null),
  secretRef: z.string().trim().max(120).optional().transform((value) => value || null),
});
