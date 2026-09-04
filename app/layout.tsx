import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "岁时 · 家庭生日簿",
  description: "把重要的日子，好好记住。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
