"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { channelSchema, personSchema, ruleSchema } from "@/lib/validation";

export type ActionState = { error?: string };

function firstError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "提交的数据不正确";
}

export async function savePerson(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = personSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, birthYear, ...data } = parsed.data;
  const normalized = { ...data, birthYear: birthYear === "" ? null : birthYear };

  if (id) await db.person.update({ where: { id: BigInt(id) }, data: normalized });
  else await db.person.create({ data: normalized });

  revalidatePath("/");
  redirect("/");
}

export async function deletePerson(formData: FormData) {
  const id = String(formData.get("id"));
  if (!/^\d+$/.test(id)) return;
  await db.person.delete({ where: { id: BigInt(id) } });
  revalidatePath("/");
}

export async function togglePerson(formData: FormData) {
  const id = String(formData.get("id"));
  const enabled = formData.get("enabled") === "true";
  if (!/^\d+$/.test(id)) return;
  await db.person.update({ where: { id: BigInt(id) }, data: { enabled } });
  revalidatePath("/");
}

export async function addRule(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = ruleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  try {
    await db.reminderRule.create({ data: { daysBefore: parsed.data.daysBefore } });
  } catch {
    return { error: "这个提醒时间已经存在" };
  }
  revalidatePath("/");
  return {};
}

export async function deleteRule(formData: FormData) {
  const id = String(formData.get("id"));
  if (/^\d+$/.test(id)) await db.reminderRule.delete({ where: { id: BigInt(id) } });
  revalidatePath("/");
}

export async function addChannel(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = channelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.notificationChannel.create({ data: parsed.data });
  revalidatePath("/");
  return {};
}

export async function toggleChannel(formData: FormData) {
  const id = String(formData.get("id"));
  const enabled = formData.get("enabled") === "true";
  if (/^\d+$/.test(id)) await db.notificationChannel.update({ where: { id: BigInt(id) }, data: { enabled } });
  revalidatePath("/");
}
