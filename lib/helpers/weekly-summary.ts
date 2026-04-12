import {
  differenceInCalendarWeeks,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ru } from "date-fns/locale"
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

export type WeeklyGroupingField =
  | "desired_payment_date"
  | "critical_payment_date"
  | "planned_payment_date"

export type WeeklySummaryBlock = {
  weekKey: string
  weekLabel: string
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  totalCount: number
  paidCount: number
  unpaidCount: number
}

export type WeeklySummaryResult = {
  blocks: WeeklySummaryBlock[]
  totals: {
    totalAmount: number
    paidAmount: number
    unpaidAmount: number
    totalCount: number
    paidCount: number
    unpaidCount: number
  }
  undated: {
    totalAmount: number
    paidAmount: number
    unpaidAmount: number
    totalCount: number
    paidCount: number
    unpaidCount: number
  }
}

export type WeeklySummarySort =
  | "week_asc"
  | "week_desc"
  | "total_desc"
  | "total_asc"
  | "paid_desc"
  | "paid_asc"
  | "unpaid_desc"
  | "unpaid_asc"

/**
 * Даты из БД часто приходят как `yyyy-MM-dd` без таймзоны. `new Date('yyyy-MM-dd')` в JS — это полночь UTC,
 * из‑за чего в части часовых поясов календарный день сдвигается и «неделя N месяца» считается неверно.
 * Для полей без времени используем полдень локального времени — как в группировке заявок руководителя.
 */
export function parsePaymentDateForCalendar(raw: string | null | undefined): Date | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  const d = s.length > 10 ? parseISO(s) : parseISO(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function buildWeeklySummary(
  rows: PaymentRequest[],
  field: WeeklyGroupingField,
): WeeklySummaryResult {
  const byWeek = new Map<string, WeeklySummaryBlock>()
  const undated = createEmptyTotals()
  const totals = createEmptyTotals()

  for (const row of rows) {
    const amount = Number(row.amount_rub ?? 0)
    const isPaid = row.is_paid
    addToTotals(totals, amount, isPaid)

    const rawDate = row[field]
    if (!rawDate) {
      addToTotals(undated, amount, isPaid)
      continue
    }

    const date = parsePaymentDateForCalendar(String(rawDate))
    if (!date) {
      addToTotals(undated, amount, isPaid)
      continue
    }

    const month = String(date.getMonth() + 1).padStart(2, "0")
    const weekOfMonth = getCalendarWeekOfMonth(date)
    const weekKey = `${date.getFullYear()}-${month}-w${weekOfMonth}`

    const existing = byWeek.get(weekKey)
    if (existing) {
      addToTotals(existing, amount, isPaid)
      continue
    }

    const weekLabel = `${MONTHS_RU[date.getMonth()]} неделя ${weekOfMonth} (${getWeekRangeLabel(date)})`
    const block: WeeklySummaryBlock = {
      weekKey,
      weekLabel,
      ...createEmptyTotals(),
    }
    addToTotals(block, amount, isPaid)
    byWeek.set(weekKey, block)
  }

  const blocks = [...byWeek.values()].sort((a, b) => a.weekKey.localeCompare(b.weekKey))

  return { blocks, totals, undated }
}

export function getWeekKeyFromDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  const date = parsePaymentDateForCalendar(dateString)
  if (!date) return null
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const weekOfMonth = getCalendarWeekOfMonth(date)
  return `${date.getFullYear()}-${month}-w${weekOfMonth}`
}

/** Подпись недели в том же формате, что и строки сводки по неделям */
export function getWeekLabelForDateString(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  const date = parsePaymentDateForCalendar(dateString)
  if (!date) return null
  const weekOfMonth = getCalendarWeekOfMonth(date)
  return `${MONTHS_RU[date.getMonth()]} неделя ${weekOfMonth} (${getWeekRangeLabel(date)})`
}

/** Заголовок «Месяц неделя N» по понедельнику календарной недели (нумерация недель месяца, как в аналитике). */
export function getWeekOfMonthShortTitle(weekStart: Date): string {
  if (Number.isNaN(weekStart.getTime())) return "Неделя"
  const weekOfMonth = getCalendarWeekOfMonth(weekStart)
  return `${MONTHS_RU[weekStart.getMonth()]} неделя ${weekOfMonth}`
}

export function sortWeeklyBlocks(
  blocks: WeeklySummaryBlock[],
  sort: WeeklySummarySort,
): WeeklySummaryBlock[] {
  const copy = [...blocks]
  copy.sort((a, b) => {
    if (sort === "week_asc") return a.weekKey.localeCompare(b.weekKey)
    if (sort === "week_desc") return b.weekKey.localeCompare(a.weekKey)
    if (sort === "total_desc") return b.totalAmount - a.totalAmount
    if (sort === "total_asc") return a.totalAmount - b.totalAmount
    if (sort === "paid_desc") return b.paidAmount - a.paidAmount
    if (sort === "paid_asc") return a.paidAmount - b.paidAmount
    if (sort === "unpaid_desc") return b.unpaidAmount - a.unpaidAmount
    return a.unpaidAmount - b.unpaidAmount
  })
  return copy
}

function createEmptyTotals() {
  return {
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    totalCount: 0,
    paidCount: 0,
    unpaidCount: 0,
  }
}

function addToTotals(
  target: {
    totalAmount: number
    paidAmount: number
    unpaidAmount: number
    totalCount: number
    paidCount: number
    unpaidCount: number
  },
  amount: number,
  isPaid: boolean,
) {
  target.totalAmount += amount
  target.totalCount += 1
  if (isPaid) {
    target.paidAmount += amount
    target.paidCount += 1
  } else {
    target.unpaidAmount += amount
    target.unpaidCount += 1
  }
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

