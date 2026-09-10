"use client";

import { useId, useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { zhCN } from "react-day-picker/locale";
import { dateInputToDate, normalizeDateInput } from "@/lib/date-input";
import {
  birthDateConversionLabel,
  birthDateValueForCalendar,
  convertEnteredBirthDate,
  normalizeLunarDateInput,
  type BirthDateCalendar,
} from "@/lib/birth-date";
import "react-day-picker/style.css";

const earliest = new Date(1900, 0, 1);
const latest = new Date(2100, 11, 31);

export function BirthDateInput({ value, onChange, required }: {
  value: string; onChange: (value: string) => void; required: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [inputCalendar, setInputCalendar] = useState<BirthDateCalendar>("SOLAR");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [month, setMonth] = useState(() => dateInputToDate(value) ?? new Date(1990, 0, 1));
  const normalized = inputCalendar === "SOLAR"
    ? normalizeDateInput(value)
    : normalizeLunarDateInput(value, isLeapMonth);
  const converted = normalized ? convertEnteredBirthDate(normalized, inputCalendar, isLeapMonth) : null;
  const selected = inputCalendar === "SOLAR" ? dateInputToDate(value) : undefined;
  const invalid = !!value && !normalized;
  const error = inputCalendar === "SOLAR"
    ? "请输入有效的公历日期，例如 1994-08-29（1900—2100 年）"
    : isLeapMonth
      ? "该年份没有这个闰月，或农历日期无效"
      : "请输入有效的农历日期，例如 1968-12-27（1900—2100 年）";

  function normalize(raw: string, calendar = inputCalendar, leap = isLeapMonth) {
    return calendar === "SOLAR" ? normalizeDateInput(raw) : normalizeLunarDateInput(raw, leap);
  }

  function update(raw: string) {
    const next = normalize(raw);
    onChange(/^\d{8}$/.test(raw.trim()) && next ? next : raw);
    inputRef.current?.setCustomValidity(raw && !next ? error : "");
    const date = inputCalendar === "SOLAR" ? dateInputToDate(raw) : undefined;
    if (date) setMonth(date);
  }

  function changeInputCalendar(nextCalendar: BirthDateCalendar) {
    if (nextCalendar === inputCalendar) return;
    let nextValue = value;
    let nextLeapMonth = false;

    // When editing an already valid date, switching the view preserves the
    // same birthday instead of silently reinterpreting it as another day.
    if (converted) {
      nextValue = birthDateValueForCalendar(converted, nextCalendar);
      nextLeapMonth = nextCalendar === "LUNAR" && converted.lunar.isLeapMonth;
    }

    setInputCalendar(nextCalendar);
    setIsLeapMonth(nextLeapMonth);
    setOpen(false);
    setTouched(false);
    inputRef.current?.setCustomValidity("");
    onChange(nextValue);
    if (nextCalendar === "SOLAR") {
      const date = dateInputToDate(nextValue);
      if (date) setMonth(date);
    }
  }

  return (
    <div className="field field-wide birth-date-field">
      <div className="birth-date-heading-row">
        <label htmlFor={id}>{inputCalendar === "SOLAR" ? "阳历出生日期" : "农历出生日期"}</label>
        <div className="calendar-entry-switch" role="group" aria-label="录入日期类型">
          <button type="button" className={inputCalendar === "SOLAR" ? "active" : ""}
            aria-pressed={inputCalendar === "SOLAR"} onClick={() => changeInputCalendar("SOLAR")}>阳历录入</button>
          <button type="button" className={inputCalendar === "LUNAR" ? "active" : ""}
            aria-pressed={inputCalendar === "LUNAR"} onClick={() => changeInputCalendar("LUNAR")}>农历录入</button>
        </div>
      </div>
      <div className="birth-date-entry">
        <input type="hidden" name="birthDateCalendar" value={inputCalendar} />
        <input type="hidden" name="birthDate" value={normalized ?? value} />
        <input ref={inputRef} id={id} type="text" inputMode="numeric"
          autoComplete="bday" placeholder={inputCalendar === "SOLAR" ? "1994-08-29 或 19940829" : "1968-12-27 或 19681227"} value={value} required={required}
          aria-describedby={`${id}-hint`} aria-invalid={touched && invalid}
          onChange={(event) => update(event.target.value)} onBlur={() => { setTouched(true); if (normalized) onChange(normalized); }}
          onInvalid={() => setTouched(true)} />
        {value ? <button type="button" className="date-clear" aria-label="清空出生日期" onClick={() => {
          update(""); setTouched(false); inputRef.current?.focus();
        }}><X size={16} /></button> : null}
        {inputCalendar === "SOLAR" ? <button type="button" ref={triggerRef} className="date-calendar-trigger" aria-label="选择出生日期"
          aria-expanded={open} aria-controls={`${id}-calendar`} onClick={() => {
            if (!open && selected) setMonth(selected);
            setOpen(!open);
          }}><CalendarDays size={19} /><span>日历</span></button> : null}
      </div>
      {inputCalendar === "LUNAR" ? <label className="lunar-leap-toggle">
        <input name="birthDateIsLeapMonth" type="checkbox" checked={isLeapMonth} onChange={(event) => {
          const nextLeapMonth = event.target.checked;
          setIsLeapMonth(nextLeapMonth);
          const next = normalize(value, "LUNAR", nextLeapMonth);
          inputRef.current?.setCustomValidity(value && !next
            ? nextLeapMonth ? "该年份没有这个闰月，或农历日期无效" : "请输入有效的农历日期"
            : "");
          setTouched(!!value);
        }} />
        <span>这是闰月日期</span>
      </label> : null}
      <small id={`${id}-hint`} className={`birth-date-hint${touched && invalid ? " date-error" : ""}`} aria-live="polite">
        {converted ? birthDateConversionLabel(converted) : touched && invalid ? error : inputCalendar === "SOLAR"
          ? "默认按阳历录入；填写后自动换算并保存农历日期。"
          : "请按农历年、月、日填写；腊月跨到次年会自动换算。"}
      </small>
      {open && inputCalendar === "SOLAR" ? <div id={`${id}-calendar`} className="birth-date-calendar" role="group" aria-label="出生日期日历"
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
