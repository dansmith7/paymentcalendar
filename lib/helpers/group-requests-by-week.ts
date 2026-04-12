import { compareAsc, endOfWeek, format, parseISO, startOfWeek } from "date-fns"
import { ru } from "date-fns/locale"
import {
  getWeekOfMonthShortTitle,
  parsePaymentDateForCalendar,
} from "@/lib/helpers/weekly-summary"
import type { PaymentRequest } from "@/lib/types"

export type RequestWeekGroupingField = "desired_payment_date" | "critical_payment_date"

const UNDATED_KEY = "__undated__"

function weekMondayStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function weekRangeLabel(weekStart: Date): string {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  return `${format(weekStart, "d MMM", { locale: ru })} — ${format(weekEnd, "d MMM yyyy", { locale: ru })}`
}

export type RequestsWeekGroup = {
  /** Stable id: ISO date of Monday or undated sentinel */
  weekKey: string
  /** Порядковый номер блока в списке (1…n), только для служебных целей */
  weekOrdinal: number
  /** «Апрель неделя 2» — номер недели внутри месяца, как в аналитике */
  title: string
  /** Human-readable week span; null for undated bucket */
  rangeLabel: string | null
  /** Monday of the week for ordering; null when undated */
  weekStart: Date | null
  requests: PaymentRequest[]
}

/**
 * Groups requests by calendar week (Monday — Sunday) of the given date field.
 * Weeks are sorted chronologically; requests without a date go last in one bucket.
 */
export function groupRequestsByWeek(
  requests: PaymentRequest[],
  dateField: RequestWeekGroupingField,
): RequestsWeekGroup[] {
  const buckets = new Map<string, PaymentRequest[]>()

  for (const row of requests) {
    const raw = row[dateField]
    const date = parsePaymentDateForCalendar(typeof raw === "string" ? raw : null)
    const key = date ? format(weekMondayStart(date), "yyyy-MM-dd") : UNDATED_KEY
    const list = buckets.get(key)
    if (list) list.push(row)
    else buckets.set(key, [row])
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => {
      const da = parsePaymentDateForCalendar(String(a[dateField] ?? ""))
      const db = parsePaymentDateForCalendar(String(b[dateField] ?? ""))
      if (da && db) {
        const c = compareAsc(da, db)
        if (c !== 0) return c
      } else if (da && !db) return -1
      else if (!da && db) return 1
      const ra = parsePaymentDateForCalendar(a.request_date)
      const rb = parsePaymentDateForCalendar(b.request_date)
      if (ra && rb) return compareAsc(rb, ra)
      return 0
    })
  }

  const keys = [...buckets.keys()].filter((k) => k !== UNDATED_KEY)
  keys.sort((a, b) => a.localeCompare(b))
  if (buckets.has(UNDATED_KEY)) keys.push(UNDATED_KEY)

  return keys.map((weekKey, idx) => {
    const requestsInWeek = buckets.get(weekKey)!
    const weekOrdinal = idx + 1
    if (weekKey === UNDATED_KEY) {
      return {
        weekKey,
        weekOrdinal,
        title: "Заявки без даты",
        rangeLabel: null,
        weekStart: null,
        requests: requestsInWeek,
      }
    }
    const weekStart = parseISO(`${weekKey}T12:00:00`)
    return {
      weekKey,
      weekOrdinal,
      title: getWeekOfMonthShortTitle(weekStart),
      rangeLabel: weekRangeLabel(weekStart),
      weekStart,
      requests: requestsInWeek,
    }
  })
}
