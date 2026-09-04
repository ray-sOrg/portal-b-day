import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.notificationDelivery.deleteMany();
  await prisma.reminderRule.deleteMany();
  await prisma.notificationChannel.deleteMany();
  await prisma.person.deleteMany();

  await prisma.person.createMany({
    data: [
      { name: "妈妈", relation: "家人", calendar: "LUNAR", birthMonth: 8, birthDay: 16, note: "喜欢桂花和淡奶油蛋糕" },
      { name: "爸爸", relation: "家人", calendar: "SOLAR", birthMonth: 11, birthDay: 9, note: "提前问好聚餐时间" },
      { name: "外婆", relation: "长辈", calendar: "LUNAR", birthMonth: 1, birthDay: 22 },
      { name: "小满", relation: "朋友", calendar: "SOLAR", birthYear: 1996, birthMonth: 9, birthDay: 18, note: "寄一张手写卡片" },
    ],
  });

  await prisma.reminderRule.createMany({
    data: [30, 15, 7, 3, 1, 0].map((daysBefore) => ({ daysBefore })),
  });

  await prisma.notificationChannel.create({
    data: { name: "家庭群", kind: "WECOM_BOT", secretRef: "WECOM_WEBHOOK_URL", enabled: false },
  });
}

main()
  .then(() => console.info("Seed complete"))
  .finally(() => prisma.$disconnect());
