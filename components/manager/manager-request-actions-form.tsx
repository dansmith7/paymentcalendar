"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { FINANCE_GROUP_FIELD_LABEL } from "@/lib/ui-labels"
import type { FinanceGroup, PaymentRequest, PaymentRequestStatus } from "@/lib/types"

type ManagerRequestActionsFormProps = {
  row: PaymentRequest
  financeGroups: FinanceGroup[]
  onUpdate: (id: string, formData: FormData) => Promise<void> | void
}

const MANAGER_STATUSES: { value: PaymentRequestStatus; label: string }[] = [
  { value: "in_progress", label: "В работе" },
  { value: "paid", label: "Оплачено" },
  { value: "rejected", label: "Отклонено" },
]

function normalizeStatus(status: string): PaymentRequestStatus {
  if (status === "paid" || status === "rejected") return status
  return "in_progress"
}

export function ManagerRequestActionsForm({
  row,
  financeGroups,
  onUpdate,
}: ManagerRequestActionsFormProps) {
  const [status, setStatus] = useState<PaymentRequestStatus>(() => normalizeStatus(String(row.status)))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const showPaidAt = status === "paid"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fd = new FormData(form)

    if (status === "paid") {
      const paidAt = String(fd.get("paid_at") ?? "").trim()
      if (!paidAt) {
        setError("Заполните обязательное поле «Дата оплаты факт».")
        return
      }
    }

    setError(null)
    startTransition(async () => {
      try {
        await onUpdate(row.id, fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось сохранить")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Быстрые действия руководителя</p>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <label className="block space-y-1 text-sm">
        <span>Статус</span>
        <select
          name="status"
          value={status}
          onChange={(e) => {
            setStatus(normalizeStatus(e.target.value))
            setError(null)
          }}
          className="w-full rounded-md border px-3 py-2"
        >
          {MANAGER_STATUSES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {showPaidAt ? (
        <label className="block space-y-1 text-sm">
          <span>Дата оплаты факт</span>
          <input
            name="paid_at"
            type="date"
            key={`${row.id}-paid`}
            defaultValue={row.paid_at ? row.paid_at.slice(0, 10) : ""}
            className="w-full rounded-md border px-3 py-2"
          />
        </label>
      ) : (
        <input type="hidden" name="paid_at" value="" />
      )}

      <label className="block space-y-1 text-sm">
        <span>Планируемая дата оплаты</span>
        <input
          name="planned_payment_date"
          type="date"
          defaultValue={row.planned_payment_date ?? ""}
          className="w-full rounded-md border px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-balance">{FINANCE_GROUP_FIELD_LABEL}</span>
        <select
          name="finance_group_id"
          defaultValue={row.finance_group_id ?? ""}
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Не выбрано</option>
          {financeGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  )
}
