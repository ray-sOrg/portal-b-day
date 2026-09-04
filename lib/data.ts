import { db } from "@/lib/db";
import type { PersonView } from "@/lib/types";

export async function getPeople(): Promise<PersonView[]> {
  const people = await db.person.findMany({ orderBy: [{ enabled: "desc" }, { createdAt: "asc" }] });
  return people.map((person) => ({ ...person, id: person.id.toString() }));
}

export async function getDashboardData() {
  const [people, rules, channels, deliveries] = await Promise.all([
    getPeople(),
    db.reminderRule.findMany({ where: { personId: null }, orderBy: { daysBefore: "desc" } }),
    db.notificationChannel.findMany({ orderBy: { createdAt: "asc" } }),
    db.notificationDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { person: true, channel: true } }),
  ]);

  return {
    people,
    rules: rules.map((rule) => ({ id: rule.id.toString(), daysBefore: rule.daysBefore, enabled: rule.enabled })),
    channels: channels.map((channel) => ({
      id: channel.id.toString(),
      name: channel.name,
      kind: channel.kind,
      destination: channel.destination,
      secretRef: channel.secretRef,
      enabled: channel.enabled,
    })),
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id.toString(),
      personName: delivery.person.name,
      channelName: delivery.channel.name,
      status: delivery.status,
      scheduledFor: delivery.scheduledFor,
      sentAt: delivery.sentAt,
    })),
  };
}
