import { format } from "date-fns"
import { getWeekKeyFromDate } from "@/lib/helpers/weekly-summary"
import type { PaymentRequest } from "@/lib/types"

export type AnalyticsDashboardBucket = {
  amount: number
  count: number
}

export type AnalyticsDashboardScores = {
  /** Дата «сегодня» на сервере (для подписи, если неделя не выбрана в фильтре) */
  referenceDateStr: string
  /** Неделя, по которой сейчас считаются верхние карточки: выбранная в селекте или календарная текущая */
  currentWeekKey: string | null
  /** Неоплаченные открытые заявки: желаемая дата в текущей неделе, критичная дата не в этой неделе */
  nonCriticalDesiredThisWeek: AnalyticsDashboardBucket
  /** Неоплаченные открытые заявки: критичная дата в текущей неделе */
  criticalThisWeek: AnalyticsDashboardBucket
  /** Оплаченные заявки (по полю is_paid или статусу paid) */
  paid: AnalyticsDashboardBucket
}

function isRowPaid(row: PaymentRequest): boolean {
  return Boolean(row.is_paid || row.status === "paid")
}

function isUnpaidOpen(row: PaymentRequest): boolean {
  if (isRowPaid(row)) return false
  if (row.status === "rejected") return false
  return true
}

/**
 * Сводные суммы для верхнего блока аналитики.
 * По умолчанию неделя = календарная «сегодня» (та же логика ключа, что в таблице).
 * Если передан `selectedWeekKey` (из селекта «Неделя»), карточки считаются по этой неделе.
 */
export function buildAnalyticsDashboardScores(
  rows: PaymentRequest[],
  referenceDate: Date = new Date(),
  selectedWeekKey?: string | null,
): AnalyticsDashboardScores {
  const referenceDateStr = format(referenceDate, "yyyy-MM-dd")
  const todayWeekKey = getWeekKeyFromDate(referenceDateStr)
  const trimmed = selectedWeekKey != null ? String(selectedWeekKey).trim() : ""
  const activeWeekKey = trimmed !== "" ? trimmed : todayWeekKey
  const scopePaidToSelectedWeek = trimmed !== ""

  const empty: AnalyticsDashboardBucket = { amount: 0, count: 0 }
  const result: AnalyticsDashboardScores = {
    referenceDateStr,
    currentWeekKey: activeWeekKey,
    nonCriticalDesiredThisWeek: { ...empty },
    criticalThisWeek: { ...empty },
    paid: { ...empty },
  }

  if (!activeWeekKey) return result

  for (const row of rows) {
    const amount = Number(row.amount_rub ?? 0)

    if (isRowPaid(row)) {
      if (scopePaidToSelectedWeek) {
        const desiredWeek = getWeekKeyFromDate(row.desired_payment_date)
        if (desiredWeek !== activeWeekKey) continue
      }
      result.paid.amount += amount
      result.paid.count += 1
      continue
    }

    if (!isUnpaidOpen(row)) continue

    const desiredWeek = getWeekKeyFromDate(row.desired_payment_date)
    const criticalWeek = getWeekKeyFromDate(row.critical_payment_date)
    const criticalHitsThisWeek = criticalWeek === activeWeekKey

    if (criticalHitsThisWeek) {
      result.criticalThisWeek.amount += amount
      result.criticalThisWeek.count += 1
      continue
    }

    if (desiredWeek === activeWeekKey) {
      result.nonCriticalDesiredThisWeek.amount += amount
      result.nonCriticalDesiredThisWeek.count += 1
    }
  }

  return result
}
