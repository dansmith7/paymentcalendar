import {
  differenceInCalendarWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ru } from "date-fns/locale"
import { parsePaymentDateForCalendar } from "@/lib/helpers/weekly-summary"
import type { PaymentRequest } from "@/lib/types"

const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
]

export type WeekFilterOption = {
  key: string
  label: string
}

export function toWeekFilterKey(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  const date = parsePaymentDateForCalendar(dateString)
  if (!date) return null

  const month = String(date.getMonth() + 1).padStart(2, "0")
  const weekOfMonth = getCalendarWeekOfMonth(date)
  return `${date.getFullYear()}-${month}-w${weekOfMonth}`
}

export function buildWeekFilterOptions(rows: PaymentRequest[]): WeekFilterOption[] {
  const unique = new Map<string, WeekFilterOption>()

  for (const row of rows) {
    const key = toWeekFilterKey(row.desired_payment_date)
    if (!key || unique.has(key)) continue

    const date = parsePaymentDateForCalendar(row.desired_payment_date)
    if (!date) continue
    const weekOfMonth = getCalendarWeekOfMonth(date)
    const label = `${MONTHS_RU[date.getMonth()]} неделя ${weekOfMonth} (${getWeekRangeLabel(date)})`
    unique.set(key, { key, label })
  }

  return [...unique.values()].sort((a, b) => a.key.localeCompare(b.key))
}

function getCalendarWeekOfMonth(date: Date): number {
  const monthStart = startOfMonth(date)
  const weekStartForDate = startOfWeek(date, { weekStartsOn: 1 })
  const weekStartForMonth = startOfWeek(monthStart, { weekStartsOn: 1 })
  return differenceInCalendarWeeks(weekStartForDate, weekStartForMonth, {
    weekStartsOn: 1,
  }) + 1
}

function getWeekRangeLabel(date: Date): string {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

  const start = weekStart < monthStart ? monthStart : weekStart
  const end = weekEnd > monthEnd ? monthEnd : weekEnd

  return `${format(start, "d MMM", { locale: ru })} - ${format(end, "d MMM", { locale: ru })}`
}

