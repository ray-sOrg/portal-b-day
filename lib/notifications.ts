import nodemailer from "nodemailer";

type Channel = {
  kind: "WECOM_BOT" | "EMAIL";
  destination: string | null;
  secretRef: string | null;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

async function sendWecom(channel: Channel, message: string) {
  const url = requiredEnv(channel.secretRef ?? "WECOM_WEBHOOK_URL");
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ msgtype: "text", text: { content: message } }),
  });
  if (!response.ok) throw new Error(`企业微信返回 HTTP ${response.status}`);
  const body = (await response.json()) as { errcode?: number; errmsg?: string };
  if (body.errcode !== 0) throw new Error(`企业微信发送失败：${body.errmsg ?? body.errcode}`);
}

async function sendEmail(channel: Channel, message: string) {
  if (!channel.destination) throw new Error("邮件渠道没有配置收件地址");
  const transporter = nodemailer.createTransport({
    host: requiredEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: requiredEnv("SMTP_USER"), pass: requiredEnv("SMTP_PASSWORD") },
  });
  await transporter.sendMail({
    from: requiredEnv("SMTP_FROM"),
    to: channel.destination,
    subject: "岁时 · 生日提醒",
    text: message,
  });
}

export async function sendNotification(channel: Channel, message: string) {
  if (channel.kind === "WECOM_BOT") return sendWecom(channel, message);
  return sendEmail(channel, message);
}
