"use client";

import { useActionState } from "react";
import { addChannel, addRule, type ActionState } from "@/app/actions";

const initialState: ActionState = {};

export function AddRuleForm() {
  const [state, action, pending] = useActionState(addRule, initialState);
  return (
    <form action={action} className="inline-form">
      <label>
        <span className="sr-only">提前天数</span>
        <input name="daysBefore" type="number" min="0" max="366" placeholder="天数" required />
      </label>
      <button className="secondary-button" disabled={pending}>{pending ? "添加中…" : "添加节点"}</button>
      {state.error ? <small className="form-error">{state.error}</small> : null}
    </form>
  );
}

export function AddChannelForm() {
  const [state, action, pending] = useActionState(addChannel, initialState);
  return (
    <form action={action} className="channel-form">
      <input name="name" placeholder="渠道名称，如：家庭群" required />
      <select name="kind" defaultValue="WECOM_BOT">
        <option value="WECOM_BOT">企业微信机器人</option>
        <option value="EMAIL">邮件</option>
      </select>
      <input name="destination" placeholder="收件地址（企业微信可留空）" />
      <input name="secretRef" placeholder="环境变量名，如 WECOM_WEBHOOK_URL" />
      <button className="secondary-button" disabled={pending}>{pending ? "保存中…" : "添加渠道"}</button>
      {state.error ? <small className="form-error">{state.error}</small> : null}
    </form>
  );
}
