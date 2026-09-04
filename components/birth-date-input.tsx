"use client";

import { useId, useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { zhCN } from "react-day-picker/locale";
import { dateInputToDate, normalizeDateInput } from "@/lib/date-input";
import { dualBirthdayLabel } from "@/lib/birth-date";
import "react-day-picker/style.css";

const earliest = new Date(1900, 0, 1);
const latest = new Date(2100, 11, 31);

export function BirthDateInput({ value, onChange, required }: {
  value: string; onChange: (value: string) => void; required: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [month, setMonth] = useState(() => dateInputToDate(value) ?? new Date(1990, 0, 1));
  const normalized = normalizeDateInput(value);
  const selected = dateInputToDate(value);
  const invalid = !!value && !normalized;
  const error = "请输入有效的出生日期，例如 1994-08-29（1900—2100 年）";

  function update(raw: string) {
    const next = normalizeDateInput(raw);
    onChange(/^\d{8}$/.test(raw.trim()) && next ? next : raw);
    inputRef.current?.setCustomValidity(raw && !next ? error : "");
    const date = dateInputToDate(raw);
    if (date) setMonth(date);
  }

  return (
    <div className="field field-wide birth-date-field">
      <label htmlFor={id}>公历出生日期</label>
      <div className="birth-date-entry">
        <input type="hidden" name="solarBirthDate" value={normalized ?? value} />
        <input ref={inputRef} id={id} type="text" inputMode="numeric"
          autoComplete="bday" placeholder="1994-08-29 或 19940829" value={value} required={required}
          aria-describedby={`${id}-hint`} aria-invalid={touched && invalid}
          onChange={(event) => update(event.target.value)} onBlur={() => { setTouched(true); if (normalized) onChange(normalized); }}
          onInvalid={() => setTouched(true)} />
        {value ? <button type="button" className="date-clear" aria-label="清空出生日期" onClick={() => {
          update(""); setTouched(false); inputRef.current?.focus();
        }}><X size={16} /></button> : null}
        <button type="button" ref={triggerRef} className="date-calendar-trigger" aria-label="选择出生日期"
          aria-expanded={open} aria-controls={`${id}-calendar`} onClick={() => {
            if (!open && selected) setMonth(selected);
            setOpen(!open);
          }}><CalendarDays size={19} /><span>日历</span></button>
      </div>
      <small id={`${id}-hint`} className={`birth-date-hint${touched && invalid ? " date-error" : ""}`} aria-live="polite">
        {normalized ? dualBirthdayLabel(normalized) : touched && invalid ? error : "可直接输入或粘贴日期，填写后自动换算农历。"}
      </small>
      {open ? <div id={`${id}-calendar`} className="birth-date-calendar" role="group" aria-label="出生日期日历"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus();
          }
        }}>
        <div className="birth-calendar-heading"><span>先选年份、月份，再点日期</span>
          <button type="button" className="text-button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}>收起</button>
        </div>
        <DayPicker mode="single" required locale={zhCN} captionLayout="dropdown" navLayout="after"
          startMonth={earliest} endMonth={latest} month={month} onMonthChange={setMonth}
          selected={selected} autoFocus
          labels={{ labelMonthDropdown: () => "月份", labelYearDropdown: () => "年份", labelNext: () => "下个月", labelPrevious: () => "上个月" }}
          formatters={{ formatYearDropdown: (date) => `${date.getFullYear()}年` }}
          onSelect={(date) => {
            update(normalizeDateInput(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)!);
            setOpen(false); setTouched(false); triggerRef.current?.focus();
          }} />
      </div> : null}
      {!value && !required ? <small className="birth-date-hint">不知道完整日期？也可以在下方手动填写生日月日。</small> : null}
    </div>
  );
}
