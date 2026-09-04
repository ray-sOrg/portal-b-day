# 岁时 · portal-b-day

家庭生日记录与提醒服务。当前版本刻意不包含用户、登录、Session 或权限体系，等待统一 OIDC 方案确定后再接入。

## 本地启动

```bash
cp .env.example .env
docker compose up -d
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

访问 `http://localhost:3000`。停止数据库可运行 `docker compose down`；数据保留在具名 volume 中。

> 当前没有认证与授权保护，只适合本机或受信任的内网环境。统一 OIDC 接入完成前，请勿将可写页面直接暴露到公网。

## 提醒派发

Web Deployment 与 CronJob 使用同一镜像。定时入口是：

```bash
bun run reminder:dispatch
```

派发器会读取启用的人、提醒节点和渠道，计算下一次公历/农历生日，并通过数据库唯一约束保证同一生日、规则、渠道只发送一次。企业微信 Webhook 和 SMTP 密码只从环境变量读取。

## 数据库边界

- 所有对象位于 `bday` Schema。
- `prisma/roles.sql` 提供运行角色的最小权限模板。
- 生产迁移使用数据库所有者连接；Web/CronJob 使用受限运行角色连接。
- 不要把 `bday` 加入 Supabase Data API 的 exposed schemas。

## Kubernetes

`k8s/app.yaml` 包含双副本 Web Deployment、Service 和每天北京时间 09:00 执行的 CronJob。部署前替换镜像地址，并根据 `k8s/secret.example.yaml` 在集群中创建真实 Secret；示例 Secret 不应直接提交或应用到生产。

当前腾讯云引导部署使用节点本地镜像 `localhost/portal-b-day:bootstrap-20260904`。Ingress 通过 `portal-b-day-allowlist` 限制为受信任出口 IP 和私有网段；统一认证接入前不要移除这层限制。后续常规数据库迁移使用 `k8s/migrate-job.yaml`，运行前先删除上一次同名的已完成 Job。
