type ApiResult = { errcode?: number; access_token?: string; expires_in?: number; invaliduser?: string; invalidparty?: string; invalidtag?: string; unlicenseduser?: string };
let cached: { key: string; token: string; until: number } | undefined;

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

async function request(url: URL, init?: RequestInit): Promise<ApiResult> {
  // Never surface transport errors containing credential-bearing URLs.
  let response: Response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error("企业微信请求超时或网络异常"); }
  if (!response.ok) throw new Error(`企业微信 HTTP ${response.status}`);
  try { return await response.json() as ApiResult; }
  catch { throw new Error("企业微信返回无效响应"); }
}

export async function getWecomAppToken(force = false) {
  const corp = env("WECOM_CORP_ID");
  const secret = env("WECOM_APP_SECRET");
  const key = `${corp}:${secret}`;
  if (!force && cached?.key === key && cached.until > Date.now()) return cached.token;
  const url = new URL("https://qyapi.weixin.qq.com/cgi-bin/gettoken");
  url.searchParams.set("corpid", corp);
  url.searchParams.set("corpsecret", secret);
  const body = await request(url);
  if (body.errcode !== 0 || !body.access_token) throw new Error(`企业微信凭据验证失败，错误码 ${body.errcode ?? "unknown"}`);
  cached = { key, token: body.access_token, until: Date.now() + Math.max(0, (body.expires_in ?? 0) - 120) * 1000 };
  return cached.token;
}

export async function sendWecomApp(message: string, destination?: string) {
  const agentid = Number(env("WECOM_AGENT_ID"));
  if (!Number.isSafeInteger(agentid) || agentid <= 0) throw new Error("无效的企业微信 Agent ID");
  const touser = destination?.trim() || env("WECOM_TO_USER");
  if (touser === "@all") throw new Error("生日提醒不允许全员广播，请指定成员账号");
  for (let attempt = 0; attempt < 2; attempt++) {
    const url = new URL("https://qyapi.weixin.qq.com/cgi-bin/message/send");
    url.searchParams.set("access_token", await getWecomAppToken(attempt > 0));
    const body = await request(url, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ touser, agentid, msgtype: "text", text: { content: message }, enable_duplicate_check: 1, duplicate_check_interval: 1800 }),
    });
    if (attempt === 0 && [40014, 42001].includes(body.errcode ?? 0)) continue;
    if (body.errcode !== 0) throw new Error(`企业微信应用消息失败，错误码 ${body.errcode ?? "unknown"}`);
    if (body.invaliduser || body.invalidparty || body.invalidtag || body.unlicenseduser) throw new Error("企业微信部分接收人无效或不在应用可见范围，请检查账号");
    return;
  }
}
