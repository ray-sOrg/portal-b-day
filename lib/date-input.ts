/** Accept keyboard input and common pasted dates without timezone conversion. */
export function normalizeDateInput(value: string): string | null {
  const text = value.trim();
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(text)
    ?? /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text)
    ?? /^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?$/.exec(text);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  const date = new Date(year, month - 1, day);
  if (year < 1900 || year > 2100 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function dateInputToDate(value: string): Date | undefined {
  const normalized = normalizeDateInput(value);
  if (!normalized) return undefined;
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
}
