import { db } from "../lib/db";
import { dispatchReminders } from "../lib/dispatch";

async function main() {
  const startedAt = new Date();
  console.info(`[reminder] started at ${startedAt.toISOString()}`);
  const summary = await dispatchReminders(startedAt);
  console.info(`[reminder] finished matched=${summary.matched} sent=${summary.sent} failed=${summary.failed} skipped=${summary.skipped}`);
  if (summary.failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("[reminder] fatal", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
