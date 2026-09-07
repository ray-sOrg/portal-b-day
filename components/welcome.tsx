import { CakeSlice, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SilentSso } from "@/components/silent-sso";

export function Welcome() {
  return (
    <main className="welcome-page">
      <SilentSso loginUrl="/api/auth/login?silent=1" />
      <header className="welcome-header">
        <Link className="brand" href="/" aria-label="岁时首页">
          <span className="brand-seal">岁</span>
          <span><strong>岁时</strong><small>家庭生日簿</small></span>
        </Link>
        <span className="eyebrow">把重要的日子，好好记住。</span>
      </header>
      <section className="hero" aria-labelledby="welcome-title">
        <div className="hero-copy">
          <span className="hero-kicker">SUISHI · FAMILY BIRTHDAYS</span>
          <h1 id="welcome-title">每一个重要的日子，<br /><em>都值得被记得。</em></h1>
          <p className="welcome-description">记下家人的生日，安排恰到好处的提醒，<br />让每一份祝福，都如期而至。</p>
          <a className="primary-button" href="/api/auth/login">使用统一账号登录<ChevronRight size={18} /></a>
          <p className="welcome-privacy">登录后查看生日簿。家人的生日与提醒记录不会公开展示。</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc"><CakeSlice size={78} strokeWidth={1.1} /></div>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <span className="star star-one">✦</span><span className="star star-two">✧</span>
          <span className="stamp">值得庆祝<br />每一年</span>
        </div>
      </section>
      <footer><span>岁时 · SUISHI</span><p>为家人留一份惦念。</p></footer>
    </main>
  );
}
