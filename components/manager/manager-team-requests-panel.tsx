"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ManagerRequestItem } from "@/components/manager/manager-request-item"
import { Button } from "@/components/ui/button"
import {
  groupRequestsByWeek,
  type RequestWeekGroupingField,
} from "@/lib/helpers/group-requests-by-week"
import type { FinanceGroup, PaymentRequest } from "@/lib/types"

type ManagerTeamRequestsPanelProps = {
  rows: PaymentRequest[]
  financeGroups: FinanceGroup[]
  onUpdate: (id: string, formData: FormData) => Promise<void> | void
}

function formatRub(amount: number) {
  return `${amount.toLocaleString("ru-RU")} ₽`
}

function filterBySearch(rows: PaymentRequest[], q: string): PaymentRequest[] {
  const s = q.trim().toLowerCase()
  if (!s) return rows
  return rows.filter((row) => {
    const hay = [
      row.applicant_name,
      row.payment_recipient,
      row.payment_purpose,
    ]
      .join(" ")
      .toLowerCase()
    return hay.includes(s)
  })
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  return value
}

function formatBool(value: boolean): string {
  return value ? "Да" : "Нет"
}

function partitionByStatus(rows: PaymentRequest[]) {
  const pending: PaymentRequest[] = []
  const paid: PaymentRequest[] = []
  const rejected: PaymentRequest[] = []

  for (const row of rows) {
    if (row.status === "rejected") {
      rejected.push(row)
      continue
    }
    if (row.is_paid || row.status === "paid") {
      paid.push(row)
      continue
    }
    pending.push(row)
  }

  return { pending, paid, rejected }
}

type WeekSelectionStats = {
  totalAmount: number
  selectedAmount: number
  allSelected: boolean
  partiallySelected: boolean
}

function WeekSelectAllCheckbox({
  allSelected,
  partiallySelected,
  disabled,
  onToggle,
}: {
  allSelected: boolean
  partiallySelected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.indeterminate = partiallySelected && !allSelected
  }, [partiallySelected, allSelected])

  return (
    <input
      ref={ref}
      type="checkbox"
      disabled={disabled}
      className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 accent-primary disabled:opacity-50"
      checked={allSelected}
      onChange={onToggle}
    />
  )
}

export function ManagerTeamRequestsPanel({
  rows,
  financeGroups,
  onUpdate,
}: ManagerTeamRequestsPanelProps) {
  const [search, setSearch] = useState("")
  const [dateField, setDateField] = useState<RequestWeekGroupingField>("desired_payment_date")
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const filtered = useMemo(() => filterBySearch(rows, search), [rows, search])

  const { pending, paid, rejected } = useMemo(() => partitionByStatus(filtered), [filtered])

  const weekGroups = useMemo(
    () => groupRequestsByWeek(pending, dateField),
    [pending, dateField],
  )

  const selectedSet = useMemo(() => new Set(selectedRequestIds), [selectedRequestIds])

  const weekStats = useMemo(() => {
    const map = new Map<string, WeekSelectionStats>()
    for (const group of weekGroups) {
      const ids = group.requests.map((r) => r.id)
      const totalAmount = group.requests.reduce((s, r) => s + Number(r.amount_rub ?? 0), 0)
      let selectedAmount = 0
      let selectedCount = 0
      for (const r of group.requests) {
        if (selectedSet.has(r.id)) {
          selectedAmount += Number(r.amount_rub ?? 0)
          selectedCount += 1
        }
      }
      const allSelected = ids.length > 0 && selectedCount === ids.length
      const partiallySelected = selectedCount > 0 && !allSelected
      map.set(group.weekKey, {
        totalAmount,
        selectedAmount,
        allSelected,
        partiallySelected,
      })
    }
    return map
  }, [weekGroups, selectedSet])

  const globalSelectedAmount = useMemo(() => {
    let sum = 0
    for (const id of selectedRequestIds) {
      const row = pending.find((r) => r.id === id)
      if (row) sum += Number(row.amount_rub ?? 0)
    }
    return sum
  }, [selectedRequestIds, pending])

  const toggleRequest = useCallback((id: string) => {
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleWeek = useCallback(
    (groupRequests: PaymentRequest[]) => {
      const ids = groupRequests.map((r) => r.id)
      setSelectedRequestIds((prev) => {
        const prevSet = new Set(prev)
        const allOn = ids.length > 0 && ids.every((id) => prevSet.has(id))
        if (allOn) return prev.filter((id) => !ids.includes(id))
        const next = new Set(prev)
        for (const id of ids) next.add(id)
        return [...next]
      })
    },
    [],
  )

  const handleExportAll = useCallback(async () => {
    try {
      setIsExporting(true)
      const xlsx = await import("xlsx")
      const exportRows = rows.map((row) => ({
        Заявитель: row.applicant_name,
        "Email заявителя": row.applicant_email ?? "-",
        "Дата заявки": formatDate(row.request_date),
        "Сумма, руб": Number(row.amount_rub ?? 0),
        Получатель: row.payment_recipient,
        Назначение: row.payment_purpose,
        "Желаемая дата оплаты": formatDate(row.desired_payment_date),
        "Критичная дата оплаты": formatDate(row.critical_payment_date),
        "Плановая дата оплаты": formatDate(row.planned_payment_date),
        "Финансовая группа": row.finance_group_name ?? "-",
        Статус: row.status,
        Оплачено: formatBool(Boolean(row.is_paid)),
        "Дата оплаты": formatDate(row.paid_at),
        Создано: formatDate(row.created_at),
        Обновлено: formatDate(row.updated_at),
      }))

      const worksheet = xlsx.utils.json_to_sheet(exportRows)
      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, worksheet, "Заявки команды")

      const today = new Date().toISOString().slice(0, 10)
      xlsx.writeFileXLSX(workbook, `team-requests-${today}.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }, [rows])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <label className="block min-w-[min(100%,280px)] flex-1 text-[0.9375rem]">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Поиск
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Заявитель, получатель, назначение…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <p className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-1 md:block">
            Группировка и порядок недель
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={dateField === "desired_payment_date" ? "default" : "outline"}
              onClick={() => setDateField("desired_payment_date")}
            >
              Желаемая дата оплаты
            </Button>
            <Button
              type="button"
              size="sm"
              variant={dateField === "critical_payment_date" ? "default" : "outline"}
              onClick={() => setDateField("critical_payment_date")}
            >
              Критичная дата оплаты
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleExportAll} disabled={isExporting}>
              {isExporting ? "Экспорт..." : "Экспорт в Excel"}
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2>Заявки к оплате</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
              Не оплачены и не отклонены. Группировка по неделям (
              {dateField === "desired_payment_date" ? "желаемая дата" : "критичная дата"}).
            </p>
          </div>
          {selectedRequestIds.length > 0 ? (
            <p className="text-sm font-medium text-foreground md:text-[0.9375rem]">
              Выбрано заявок:{" "}
              <span className="font-semibold">{selectedRequestIds.length}</span>
              {" · "}
              на сумму{" "}
              <span className="font-semibold text-primary">{formatRub(globalSelectedAmount)}</span>
            </p>
          ) : null}
        </div>

        {!pending.length ? (
          <p className="rounded-xl border border-border p-4 text-[0.9375rem] text-muted-foreground">
            Нет заявок к оплате.
          </p>
        ) : (
          <div className="space-y-6">
            {weekGroups.map((group) => {
              const stats = weekStats.get(group.weekKey)!
              return (
                <div
                  key={group.weekKey}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                      <label className="flex cursor-pointer items-start gap-2 text-[0.9375rem] text-foreground">
                        <WeekSelectAllCheckbox
                          allSelected={stats.allSelected}
                          partiallySelected={stats.partiallySelected}
                          disabled={!group.requests.length}
                          onToggle={() => toggleWeek(group.requests)}
                        />
                        <span className="leading-snug">Выбрать все за неделю</span>
                      </label>
                      <div className="min-w-0 sm:pl-2">
                        <p className="text-base font-semibold leading-snug md:text-[1.0625rem]">
                          {group.title}{" "}
                          <span className="font-normal text-muted-foreground">—</span> к оплате:{" "}
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatRub(stats.totalAmount)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {group.rangeLabel ?? "дата не указана"}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground sm:text-right md:text-[0.9375rem]">
                      {stats.selectedAmount > 0 ? (
                        <>
                          выбрано за неделю:{" "}
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatRub(stats.selectedAmount)}
                          </span>
                        </>
                      ) : (
                        <span className="tabular-nums">ничего не выбрано</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 p-3">
                    {group.requests.map((row) => (
                      <ManagerRequestItem
                        key={row.id}
                        row={row}
                        financeGroups={financeGroups}
                        onUpdate={onUpdate}
                        selection={{
                          checked: selectedSet.has(row.id),
                          onChange: () => toggleRequest(row.id),
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2>Оплаченные заявки</h2>
        {!paid.length ? (
          <p className="rounded-xl border border-border p-4 text-[0.9375rem] text-muted-foreground">
            Нет оплаченных заявок.
          </p>
        ) : (
          <div className="space-y-2">
            {paid.map((row) => (
              <ManagerRequestItem
                key={row.id}
                row={row}
                financeGroups={financeGroups}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2>Отклоненные заявки</h2>
        {!rejected.length ? (
          <p className="rounded-xl border border-border p-4 text-[0.9375rem] text-muted-foreground">
            Нет отклоненных заявок.
          </p>
        ) : (
          <div className="space-y-2">
            {rejected.map((row) => (
              <ManagerRequestItem
                key={row.id}
                row={row}
                financeGroups={financeGroups}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
