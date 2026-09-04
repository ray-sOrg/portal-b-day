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

新增生日默认选择「公历和农历都提醒」。填写完整公历出生日期后，系统保存原始日期，并按出生年份换算农历月日（包含闰月标记），例如 `1994-08-29` 对应农历七月廿三。双历各自匹配提醒节点，同一天重合则合并通知；没有匹配生日时不发送消息。旧记录保持原来的历法，编辑并补全公历日期后可启用双历提醒。

自建应用渠道类型为 `WECOM_APP`。在被 Git 忽略的 `.env.local` 填写 `WECOM_CORP_ID`、`WECOM_AGENT_ID`、`WECOM_APP_SECRET`、`WECOM_TO_USER`（账号用 `|` 分隔）。生产凭据位于独立的 `portal-b-day-wecom` Secret，仅注入提醒容器。`k8s/wecom-check-job.yaml` 只验证凭据，不发送消息。应用渠道可由数据库配置，当前网页添加表单仍只提供机器人/邮件。

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

Ingress 通过 `portal-b-day-allowlist` 限制为受信任出口 IP 和私有网段；统一认证接入前不要移除这层限制。

## 自动部署

推送到 `main` 或手动运行 GitHub Actions 的 `Build & Deploy`：

1. 安装依赖，生成 Prisma 客户端，运行测试、类型检查与 lint。
2. 打包当前提交，通过现有 HTTPS 部署服务提交给腾讯云。
3. 服务器构建 `localhost/portal-b-day:build-运行序号-提交号` 并导入 k3s。
4. 暂停生日 CronJob，等当前提醒结束，使用独立迁移角色运行数据库迁移。
5. 更新网站和 CronJob 到同一镜像，等待双副本就绪及数据库健康检查，再恢复原有调度状态。
6. 企业微信群机器人推送 `Deployment succeeded` 或失败消息，包含提交和 Actions 链接。

仓库 Actions Secrets 需要 `DEPLOY_HTTP_TOKEN`（仅该项目的部署权限）和 `WECOM_WEBHOOK_URL`（部署通知机器人，与生日自建应用分开）。数据库及生日通知 Secret 始终保留在集群。通知发送失败会让 CI 明确报错，不会静默跳过。

`k8s/app.yaml` 是镜像占位符模板，由 CI 渲染成 `deployment.yaml`，不要直接应用未渲染的模板。服务器管理员安装 `ops/k3s-http-deploy`、`ops/k3s-build-deployment-image` 和 `ops/k3s-deploy-bday`；这些脚本不会随普通应用提交自动更新。前两者是共享部署服务的兼容扩展，其他项目流程保持不变。

迁移失败不更新网站；发布失败会回滚网站并恢复 CronJob 的上一份配置。已成功执行的数据库迁移不会逆向回滚，因此迁移必须与上一版应用兼容。部署权限定义见 `k8s/deployer-rbac.yaml`，不允许读取 Secret 或修改其他应用的 Deployment。
