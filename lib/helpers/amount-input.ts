/** Пробелы как разряды, запятая как десятичный разделитель (ввод). */
export function formatRubAmountInput(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return ""
  const rounded = Math.round(value * 100) / 100
  const intPart = Math.trunc(rounded)
  const frac = Math.round((rounded - intPart) * 100)
  const spaced = String(Math.abs(intPart)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  if (frac === 0) return spaced
  const fracStr = String(frac).padStart(2, "0")
  return `${spaced},${fracStr}`
}

export function parseRubAmountInput(raw: string): number {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "")
  if (!cleaned) return Number.NaN
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : Number.NaN
}
