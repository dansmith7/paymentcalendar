"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { formatRubAmountInput, parseRubAmountInput } from "@/lib/helpers/amount-input"
import { getPaidAmountRub, getRemainingAmountRub } from "@/lib/helpers/payment-request"
import { FINANCE_GROUP_FIELD_LABEL } from "@/lib/ui-labels"
import type { FinanceGroup, PaymentRequest } from "@/lib/types"

type ManagerRequestActionsFormProps = {
  row: PaymentRequest
  financeGroups: FinanceGroup[]
  onUpdate: (id: string, formData: FormData) => Promise<void> | void
  onAddPayment: (id: string, formData: FormData) => Promise<void> | void
  canSoftDelete?: boolean
  onSoftDelete?: (id: string) => Promise<void> | void
}

function formatRub(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`
}

export function ManagerRequestActionsForm({
  row,
  financeGroups,
  onUpdate,
  onAddPayment,
  canSoftDelete = false,
  onSoftDelete,
}: ManagerRequestActionsFormProps) {
  const [paymentAmountText, setPaymentAmountText] = useState("")
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isAddingPayment, startPaymentTransition] = useTransition()

  const paidAmount = getPaidAmountRub(row)
  const remainingAmount = getRemainingAmountRub(row)
  const nextPaymentAmount = parseRubAmountInput(paymentAmountText)
  const remainingAfterPayment = Math.max(
    0,
    remainingAmount - (Number.isFinite(nextPaymentAmount) ? nextPaymentAmount : 0),
  )
  const canAddPayment = row.status !== "rejected" && remainingAmount > 0

  function handleUpdateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    setUpdateError(null)
    startUpdateTransition(async () => {
      try {
        await onUpdate(row.id, fd)
      } catch (err) {
        setUpdateError(err instanceof Error ? err.message : "Не удалось сохранить")
      }
    })
  }

  function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fd = new FormData(form)
    const paidAt = String(fd.get("paid_at") ?? "").trim()
    const amount = parseRubAmountInput(String(fd.get("amount_rub") ?? ""))

    if (!paidAt) {
      setPaymentError("Заполните дату оплаты.")
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Сумма оплаты должна быть больше нуля.")
      return
    }
    if (amount > remainingAmount) {
      setPaymentError("Сумма оплаты больше остатка к оплате.")
      return
    }

    setPaymentError(null)
    startPaymentTransition(async () => {
      try {
        await onAddPayment(row.id, fd)
        setPaymentAmountText("")
        form.reset()
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : "Не удалось добавить оплату")
      }
    })
  }

  function handleSoftDelete() {
    if (!onSoftDelete) return
    const ok = window.confirm("Скрыть заявку из рабочих списков? Данные останутся в базе.")
    if (!ok) return

    setUpdateError(null)
    startUpdateTransition(async () => {
      try {
        await onSoftDelete(row.id)
      } catch (err) {
        setUpdateError(err instanceof Error ? err.message : "Не удалось скрыть заявку")
      }
    })
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Быстрые действия руководителя</p>

      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
        <div>
          <span className="text-muted-foreground">Всего оплачено</span>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground">{formatRub(paidAmount)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Остаток к оплате</span>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground">{formatRub(remainingAmount)}</p>
        </div>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-3 border-b pb-3">
        <p className="text-sm font-medium">Оплата заявки</p>
        {paymentError ? <p className="text-sm text-red-600 dark:text-red-400">{paymentError}</p> : null}

        <label className="block space-y-1 text-sm">
          <span>Дата оплаты факт</span>
          <input
            name="paid_at"
            type="date"
            disabled={!canAddPayment || isAddingPayment}
            className="w-full rounded-md border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Сумма оплаты</span>
          <input
            name="amount_rub"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={paymentAmountText}
            disabled={!canAddPayment || isAddingPayment}
            onChange={(event) => setPaymentAmountText(event.target.value)}
            onBlur={() => {
              const nextAmount = parseRubAmountInput(paymentAmountText)
              if (Number.isFinite(nextAmount) && nextAmount > 0) {
                setPaymentAmountText(formatRubAmountInput(nextAmount))
              }
            }}
            placeholder="Например: 500 000"
            className="w-full rounded-md border px-3 py-2 tabular-nums disabled:bg-muted disabled:text-muted-foreground"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Комментарий</span>
          <input
            name="note"
            type="text"
            disabled={!canAddPayment || isAddingPayment}
            placeholder="Необязательно"
            className="w-full rounded-md border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
          />
        </label>

        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Остаток после оплаты</span>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground">
            {formatRub(remainingAfterPayment)}
          </p>
        </div>

        <Button type="submit" size="sm" disabled={!canAddPayment || isAddingPayment}>
          {isAddingPayment ? "Проведение…" : "Оплатить"}
        </Button>
      </form>

      <form onSubmit={handleUpdateSubmit} className="space-y-3">
        <p className="text-sm font-medium">Параметры заявки</p>
        {updateError ? <p className="text-sm text-red-600 dark:text-red-400">{updateError}</p> : null}

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

        <Button type="submit" size="sm" disabled={isUpdating}>
          {isUpdating ? "Сохранение…" : "Сохранить"}
        </Button>

        {canSoftDelete ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={handleSoftDelete}
            className="ml-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
          >
            Скрыть заявку
          </Button>
        ) : null}
      </form>
    </div>
  )
}
