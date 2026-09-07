import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BellRing, CalendarCheck2, CakeSlice, ChevronRight, Clock3, Gift, Mail, MoreHorizontal, Send, Sparkles, UsersRound } from "lucide-react";
import { AddChannelForm, AddRuleForm } from "@/components/settings-forms";
import { navItems } from "@/components/icons";
import { PersonForm } from "@/components/person-form";
import { StatusPill } from "@/components/status-pill";
import { deletePerson, deleteRule, toggleChannel, togglePerson } from "@/app/actions";
import { birthdayLabel, sortUpcoming } from "@/lib/birthday";
import { getDashboardData } from "@/lib/data";
import { currentUser } from "@/lib/auth";
import { Welcome } from "@/components/welcome";

export const dynamic = "force-dynamic";

function daysCopy(days: number) {
  if (days === 0) return "就是今天";
  if (days === 1) return "明天";
  return `${days} 天后`;
}

function initials(name: string) {
  return Array.from(name).slice(-2).join("");
}

export default async function Home() {
  const user = await currentUser();
  if (!user) return <Welcome />;
  const data = await getDashboardData();
  const upcoming = sortUpcoming(data.people.filter((person) => person.enabled));
  const spotlight = upcoming[0];
  const now = new Date();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#today" aria-label="岁时首页">
          <span className="brand-seal">岁</span>
          <span><strong>岁时</strong><small>家庭生日簿</small></span>
        </a>
        <nav>
          {navItems.map(({ href, label, icon: Icon }, index) => (
            <a key={href} href={href} className={index === 0 ? "active" : ""}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={17} />
          <p>把重要的日子<br />好好记住。</p>
        </div>
        <div className="sidebar-foot">SUISHI · 2026</div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">{format(now, "yyyy · MM · dd · EEEE", { locale: zhCN })}</span>
            <h1>早上好，今天也别忘了想念。</h1>
          </div>
          <div className="topbar-actions">
            <span className="signed-in-user">{user.username}</span>
            <form action="/api/auth/logout" method="post"><button className="logout-link" type="submit">退出</button></form>
            <PersonForm />
          </div>
        </header>

        <section className="hero" id="today">
          <div className="hero-copy">
            <span className="hero-kicker">NEXT CELEBRATION</span>
            {spotlight ? (
              <>
                <p className="hero-date">{format(spotlight.nextBirthday, "MM / dd")}</p>
                <h2>下一份祝福，留给<br /><em>{spotlight.name}</em></h2>
                <div className="hero-meta">
                  <span><Clock3 size={16} />{daysCopy(spotlight.daysUntil)}</span>
                  <span><CalendarCheck2 size={16} />{birthdayLabel(spotlight)}</span>
                  {spotlight.age ? <span><Gift size={16} />将满 {spotlight.age} 岁</span> : null}
                </div>
                {spotlight.note ? <blockquote>“{spotlight.note}”</blockquote> : null}
              </>
            ) : (
              <>
                <p className="hero-date">— / —</p>
                <h2>生日簿还是空的，<br /><em>记下第一位吧。</em></h2>
              </>
            )}
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun-disc"><CakeSlice size={78} strokeWidth={1.1} /></div>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="star star-one">✦</span>
            <span className="star star-two">✧</span>
            <span className="stamp">值得庆祝<br />每一年</span>
          </div>
        </section>

        <section className="section-block" id="birthdays">
          <div className="section-heading">
            <div><span className="section-number">01</span><h2>接下来的日子</h2></div>
            <span className="muted">已记录 {data.people.length} 位 · {upcoming.length} 位启用</span>
          </div>

          <div className="upcoming-grid">
            {upcoming.slice(0, 4).map((person, index) => (
              <article className={`upcoming-card tone-${index % 4}`} key={person.id}>
                <div className="card-top">
                  <span className="avatar">{initials(person.name)}</span>
                  <span className="day-count">{daysCopy(person.daysUntil)}</span>
                </div>
                <div className="card-date"><strong>{format(person.nextBirthday, "dd")}</strong><span>{format(person.nextBirthday, "MMM", { locale: zhCN })}</span></div>
                <h3>{person.name}</h3>
                <p>{person.relation ?? "未分组"} · {birthdayLabel(person)}</p>
              </article>
            ))}
            {upcoming.length === 0 ? <div className="empty-state">还没有生日记录。点击右上角“记下一位”开始。</div> : null}
          </div>

          <div className="roster">
            <div className="roster-head">
              <div><UsersRound size={18} /><strong>完整生日簿</strong></div>
              <span>按录入顺序排列</span>
            </div>
            {data.people.map((person) => {
              const next = upcoming.find((item) => item.id === person.id);
              return (
                <div className={`person-row ${person.enabled ? "" : "disabled"}`} key={person.id}>
                  <span className="mini-avatar">{initials(person.name)}</span>
                  <div className="person-name"><strong>{person.name}</strong><span>{person.relation ?? "未分组"}</span></div>
                  <div className="person-birthday"><strong>{birthdayLabel(person)}</strong><span>{next ? format(next.nextBirthday, "yyyy 年 MM 月 dd 日") : "提醒已暂停"}</span></div>
                  <div className="person-note">{person.note ?? "还没有写备忘"}</div>
                  <div className="row-actions">
                    <PersonForm person={person} trigger="link" />
                    <details className="more-menu">
                      <summary aria-label="更多操作"><MoreHorizontal size={19} /></summary>
                      <div>
                        <form action={togglePerson}><input type="hidden" name="id" value={person.id} /><input type="hidden" name="enabled" value={String(!person.enabled)} /><button>{person.enabled ? "暂停提醒" : "恢复提醒"}</button></form>
                        <form action={deletePerson}><input type="hidden" name="id" value={person.id} /><button className="danger">删除记录</button></form>
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section-block" id="reminders">
          <div className="section-heading">
            <div><span className="section-number">02</span><h2>提醒节奏</h2></div>
            <span className="muted">每天 09:00 检查一次</span>
          </div>
          <div className="reminder-layout">
            <article className="paper-panel">
              <div className="panel-title"><div><BellRing size={19} /><h3>默认提醒节点</h3></div><span>适用于所有人</span></div>
              <div className="rule-line">
                {data.rules.map((rule) => (
                  <form action={deleteRule} key={rule.id} className="rule-chip">
                    <input type="hidden" name="id" value={rule.id} />
                    <span>{rule.daysBefore === 0 ? "当天" : `提前 ${rule.daysBefore} 天`}</span>
                    <button aria-label={`删除提前 ${rule.daysBefore} 天提醒`}>×</button>
                  </form>
                ))}
              </div>
              <AddRuleForm />
            </article>
            <article className="paper-panel dispatch-panel">
              <div className="panel-title"><div><Send size={19} /><h3>派发方式</h3></div><span>{data.channels.filter((item) => item.enabled).length} 个已启用</span></div>
              {data.channels.map((channel) => (
                <div className="channel-row" key={channel.id}>
                  <span className="channel-icon">{channel.kind === "EMAIL" ? <Mail size={18} /> : <Send size={18} />}</span>
                  <div><strong>{channel.name}</strong><span>{channel.kind === "EMAIL" ? channel.destination : channel.secretRef ?? "未配置 Secret"}</span></div>
                  <form action={toggleChannel}>
                    <input type="hidden" name="id" value={channel.id} />
                    <input type="hidden" name="enabled" value={String(!channel.enabled)} />
                    <button className={`switch ${channel.enabled ? "on" : ""}`} aria-label={channel.enabled ? "停用渠道" : "启用渠道"}><span /></button>
                  </form>
                </div>
              ))}
              <details className="add-channel"><summary>＋ 添加通知渠道</summary><AddChannelForm /></details>
            </article>
          </div>
        </section>

        <section className="section-block last-section" id="settings">
          <div className="section-heading">
            <div><span className="section-number">03</span><h2>最近发送</h2></div>
            <span className="muted">派发记录用于排查重复或失败</span>
          </div>
          <div className="delivery-list">
            {data.deliveries.length ? data.deliveries.map((delivery) => (
              <div className="delivery-row" key={delivery.id}>
                <span className="delivery-dot" />
                <div><strong>{delivery.personName}</strong><span>经由 {delivery.channelName}</span></div>
                <time>{format(delivery.sentAt ?? delivery.scheduledFor, "MM 月 dd 日 HH:mm")}</time>
                <StatusPill status={delivery.status} />
                <ChevronRight size={17} className="muted-icon" />
              </div>
            )) : <div className="empty-state compact">暂无发送记录。CronJob 第一次运行后会显示在这里。</div>}
          </div>
        </section>

        <footer><span>岁时 · SUISHI</span><p>所有生日数据仅保存在家庭平台数据库的 <code>bday</code> Schema。</p></footer>
      </main>
    </div>
  );
}
