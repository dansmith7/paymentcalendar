"use client"

import { useMemo, useState } from "react"
import { toDisplayDate } from "@/lib/helpers/payment-request"
import type { PaymentRequest } from "@/lib/types"

type AnalyticsBulkSelectorProps = {
  rows: PaymentRequest[]
}

export function AnalyticsBulkSelector({ rows }: AnalyticsBulkSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  )
  const selectedAmount = useMemo(
    () => selectedRows.reduce((sum, row) => sum + Number(row.amount_rub ?? 0), 0),
    [selectedRows],
  )

  const isAllChecked = rows.length > 0 && selectedIds.length === rows.length

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.length === rows.length ? [] : rows.map((row) => row.id)))
  }

  return (
    <div className="mt-4 rounded-xl border p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Dev: массовый выбор заявок</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Выбрано: {selectedIds.length} | Сумма:{" "}
          <span className="font-semibold">{selectedAmount.toLocaleString("ru-RU")} ₽</span>
        </p>
      </div>

      {!rows.length ? (
        <p className="text-sm text-zinc-500">Нет заявок для выбора.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input type="checkbox" checked={isAllChecked} onChange={toggleAll} />
                </th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Заявитель</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Дата заявки</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Сумма</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Получатель</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Назначение</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Желаемая дата</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Критичная дата</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Группа</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Планируемая дата</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Оплачено</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Дата оплаты факт</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-600">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">{row.applicant_name}</td>
                  <td className="px-3 py-2 text-center">{toDisplayDate(row.request_date)}</td>
                  <td className="px-3 py-2 text-center">{Number(row.amount_rub).toLocaleString("ru-RU")} ₽</td>
                  <td className="px-3 py-2 text-center">{row.payment_recipient}</td>
                  <td className="px-3 py-2 text-center">{row.payment_purpose}</td>
                  <td className="px-3 py-2 text-center">{toDisplayDate(row.desired_payment_date)}</td>
                  <td className="px-3 py-2 text-center">{toDisplayDate(row.critical_payment_date)}</td>
                  <td className="px-3 py-2 text-center">{row.finance_group_name ?? "-"}</td>
                  <td className="px-3 py-2 text-center">{toDisplayDate(row.planned_payment_date)}</td>
                  <td className="px-3 py-2 text-center">{row.is_paid ? "Да" : "Нет"}</td>
                  <td className="px-3 py-2 text-center">{toDisplayDate(row.paid_at)}</td>
                  <td className="px-3 py-2 text-center">{statusLabel(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function statusLabel(status: PaymentRequest["status"]) {
  if (status === "in_progress") return "В работе"
  if (status === "partially_paid") return "Частично оплачено"
  if (status === "rejected") return "Отклонено"
  if (status === "paid") return "Оплачено"
  return status
}
