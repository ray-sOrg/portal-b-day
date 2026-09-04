"use client";

import { useActionState, useRef, useState } from "react";
import { dualBirthdayLabel } from "@/lib/birth-date";
import { Plus, X } from "lucide-react";
import { savePerson, type ActionState } from "@/app/actions";
import type { PersonView } from "@/lib/types";

const initialState: ActionState = {};

export function PersonForm({ person, trigger = "button" }: { person?: PersonView; trigger?: "button" | "link" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(savePerson, initialState);
  const [calendar, setCalendar] = useState(person?.calendar ?? "BOTH");

  const [solarBirthDate, setSolarBirthDate] = useState(person?.solarBirthDate ?? "");
  let preview = "";
  try { if (solarBirthDate) preview = dualBirthdayLabel(solarBirthDate); } catch { preview = "请输入有效的完整日期"; }

  return (
    <>
      <button className={trigger === "link" ? "text-button" : "primary-button"} onClick={() => dialogRef.current?.showModal()}>
        {trigger === "button" ? <Plus size={18} /> : null}
        {person ? "编辑" : "记下一位"}
      </button>
      <dialog className="person-dialog" ref={dialogRef}>
        <div className="dialog-topline" />
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">BIRTHDAY NOTE</span>
            <h2>{person ? "修改这张生日笺" : "记下一位重要的人"}</h2>
          </div>
          <button className="icon-button" onClick={() => dialogRef.current?.close()} aria-label="关闭">
            <X size={19} />
          </button>
        </div>

        <form action={action} className="person-form">
          {person ? <input type="hidden" name="id" value={person.id} /> : null}
          <div className="field-grid">
            <label className="field field-wide">
              <span>姓名 / 称呼</span>
              <input name="name" defaultValue={person?.name} placeholder="例如：妈妈" autoFocus required />
            </label>
            <label className="field">
              <span>关系</span>
              <input name="relation" defaultValue={person?.relation ?? ""} placeholder="家人、朋友…" />
            </label>
            <label className="field">
              <span>按哪种历法提醒</span>
              <select name="calendar" value={calendar} onChange={(event) => setCalendar(event.target.value as PersonView["calendar"])}>
                <option value="BOTH">公历和农历都提醒</option>
                <option value="SOLAR">公历</option>
                <option value="LUNAR">农历</option>
              </select>
            </label>
            <label className="field field-wide">
              <span>公历出生日期（填写后自动记住两种生日）</span>
              <input type="date" name="solarBirthDate" min="1900-01-01" max="2100-12-31" required={calendar === "BOTH"} value={solarBirthDate} onChange={(event) => setSolarBirthDate(event.target.value)} />
              <small aria-live="polite">{preview || "双历提醒需要完整公历日期；只知道月日时，请选择单一历法手动记录。"}</small>
            </label>
            {solarBirthDate ? <>
              <input type="hidden" name="birthYear" value="" />
              <input type="hidden" name="birthMonth" value="1" />
              <input type="hidden" name="birthDay" value="1" />
            </> : <>
            <label className="field">
              <span>出生年份（可选）</span>
              <input name="birthYear" type="number" min="1900" max="2200" defaultValue={person?.birthYear ?? ""} placeholder="不知道可留空" />
            </label>
            <div className="field date-fields">
              <span>生日</span>
              <div>
                <label><input name="birthMonth" type="number" min="1" max="12" defaultValue={person?.birthMonth ?? 1} required /><small>月</small></label>
                <label><input name="birthDay" type="number" min="1" max="31" defaultValue={person?.birthDay ?? 1} required /><small>日</small></label>
              </div>
            </div>
            {calendar === "LUNAR" ? (
              <label className="check-field field-wide">
                <input name="isLeapMonth" type="checkbox" defaultChecked={person?.isLeapMonth} />
                <span>这是闰月生日</span>
              </label>
            ) : null}
            </>}
            <label className="field field-wide">
              <span>备忘</span>
              <textarea name="note" defaultValue={person?.note ?? ""} rows={3} placeholder="喜欢什么蛋糕、要提前准备什么……" />
            </label>
          </div>
          {person?.enabled !== false ? <input type="hidden" name="enabled" value="true" /> : null}
          {state.error ? <p className="form-error">{state.error}</p> : null}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={() => dialogRef.current?.close()}>先不写了</button>
            <button type="submit" className="primary-button" disabled={pending}>{pending ? "正在保存…" : "收进生日簿"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
