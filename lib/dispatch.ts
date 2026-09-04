import { Prisma } from "@prisma/client";
import { format, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { birthdayVariants, withUpcoming } from "@/lib/birthday";
import { sendNotification } from "@/lib/notifications";

export type DispatchSummary = { matched: number; sent: number; failed: number; skipped: number };

function messageFor(name: string, date: Date, daysBefore: number) {
  const when = daysBefore === 0 ? "今天" : daysBefore === 1 ? "明天" : `${daysBefore} 天后`;
  return `🎂 生日提醒\n${name}的生日就在${when}（${format(date, "MM 月 dd 日")}）。记得提前准备一份心意。`;
}

export async function dispatchReminders(today = new Date()): Promise<DispatchSummary> {
  const scheduledFor = startOfDay(today);
  const [people, globalRules, channels] = await Promise.all([
    db.person.findMany({ where: { enabled: true }, include: { rules: { where: { enabled: true } } } }),
    db.reminderRule.findMany({ where: { personId: null, enabled: true } }),
    db.notificationChannel.findMany({ where: { enabled: true } }),
  ]);

  const summary: DispatchSummary = { matched: 0, sent: 0, failed: 0, skipped: 0 };

  for (const person of people) {
    const variants = birthdayVariants({ ...person, id: person.id.toString() });
    const occurrences = variants.map((variant) => withUpcoming(variant, today));
    // Shared date => a single reminder per rule/channel, also protected by DB uniqueness.
    const uniqueDates = new Map(occurrences.map((view) => [view.nextBirthday.getTime(), view]));
    for (const view of uniqueDates.values()) {
    const rules = person.rules.length ? person.rules : globalRules;
    const matchingRules = rules.filter((rule) => rule.daysBefore === view.daysUntil);
    if (!matchingRules.length) continue;

    for (const rule of matchingRules) {
      for (const channel of channels) {
        summary.matched += 1;
        const labels = occurrences.filter((item) => item.nextBirthday.getTime() === view.nextBirthday.getTime()).map((item) => item.calendar === "LUNAR" ? "农历" : "公历");
        const message = messageFor(`${person.name}（${labels.join(" / ")}）`, view.nextBirthday, rule.daysBefore);
        let deliveryId: bigint;

        try {
          const delivery = await db.notificationDelivery.create({
            data: {
              personId: person.id,
              ruleId: rule.id,
              channelId: channel.id,
              birthdayOn: view.nextBirthday,
              scheduledFor,
              daysBefore: rule.daysBefore,
              message,
            },
          });
          deliveryId = delivery.id;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            summary.skipped += 1;
            continue;
          }
          throw error;
        }

        try {
          await sendNotification(channel, message);
          await db.notificationDelivery.update({ where: { id: deliveryId }, data: { status: "SENT", sentAt: new Date() } });
          summary.sent += 1;
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          await db.notificationDelivery.update({ where: { id: deliveryId }, data: { status: "FAILED", error: detail } });
          summary.failed += 1;
        }
      }
    }
    }
  }

  return summary;
}
