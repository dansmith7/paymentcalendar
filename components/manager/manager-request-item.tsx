import {
  getPaidAmountRub,
  getRemainingAmountRub,
  isPaymentStarted,
  toDisplayDate,
} from "@/lib/helpers/payment-request"
import { FINANCE_GROUP_FIELD_LABEL } from "@/lib/ui-labels"
import { CancelPaymentButton } from "@/components/manager/cancel-payment-button"
import { ManagerRequestActionsForm } from "@/components/manager/manager-request-actions-form"
import type { FinanceGroup, PaymentRequest } from "@/lib/types"

type ManagerRequestItemProps = {
  row: PaymentRequest
  financeGroups: FinanceGroup[]
  onUpdate: (id: string, formData: FormData) => Promise<void> | void
  onAddPayment: (id: string, formData: FormData) => Promise<void> | void
  onCancelPayment: (id: string, paymentId: string) => Promise<void> | void
  canSoftDelete?: boolean
  onSoftDelete?: (id: string) => Promise<void> | void
  selection?: {
    checked: boolean
    onChange: () => void
  }
}

export function ManagerRequestItem({
  row,
  financeGroups,
  onUpdate,
  onAddPayment,
  onCancelPayment,
  canSoftDelete = false,
  onSoftDelete,
  selection,
}: ManagerRequestItemProps) {
  const payments = row.payments ?? []
  const paidAmount = getPaidAmountRub(row)
  const paymentsAmount = payments.reduce((sum, payment) => sum + Number(payment.amount_rub ?? 0), 0)
  const legacyPaymentDelta = Math.max(0, paidAmount - paymentsAmount)
  return (
    <div className="flex gap-3 rounded-xl border bg-white p-3 dark:bg-zinc-950">
      {selection ? (
        <label className="flex cursor-pointer items-start pt-1">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-zinc-300 accent-primary"
            checked={selection.checked}
            onChange={selection.onChange}
          />
          <span className="sr-only">Выбрать заявку</span>
        </label>
      ) : null}
      <details
        suppressHydrationWarning
        className="min-w-0 flex-1 list-none [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="cursor-pointer">
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4 lg:grid-cols-8">
            <Info label="Заявитель" value={row.applicant_name} />
            <Info label="Дата заявки" value={toDisplayDate(row.request_date)} />
            <Info label="Сумма" value={`${row.amount_rub.toLocaleString("ru-RU")} ₽`} />
            <Info
              label="Остаток к оплате"
              value={`${getRemainingAmountRub(row).toLocaleString("ru-RU")} ₽`}
            />
            <Info label="Получатель" value={row.payment_recipient} />
            <Info label="Желаемая дата" value={toDisplayDate(row.desired_payment_date)} />
            <Info label="Критичная дата" value={toDisplayDate(row.critical_payment_date)} />
            <Info label="Статус" value={statusLabel(row.status)} />
          </div>
        </summary>

        <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <Info label="Назначение платежа" value={row.payment_purpose} />
            <Info label="Критичная дата" value={toDisplayDate(row.critical_payment_date)} />
            <Info label={FINANCE_GROUP_FIELD_LABEL} value={row.finance_group_name ?? "-"} />
            <Info label="Планируемая дата оплаты" value={toDisplayDate(row.planned_payment_date)} />
            <Info label="Оплачено" value={row.is_paid ? "Да" : "Нет"} />
            {isPaymentStarted(row) ? (
              <>
                <Info label="Дата оплаты факт" value={toDisplayDate(row.paid_at)} />
                <Info
                  label="Сумма оплачено"
                  value={`${getPaidAmountRub(row).toLocaleString("ru-RU")} ₽`}
                />
                <Info
                  label="Остаток к оплате"
                  value={`${getRemainingAmountRub(row).toLocaleString("ru-RU")} ₽`}
                />
              </>
            ) : null}
            <div className="pt-3">
              <p className="text-balance text-xs text-zinc-500">История оплат</p>
              {payments.length ? (
                <div className="mt-2 space-y-2">
                  {legacyPaymentDelta > 0 ? (
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span>{toDisplayDate(row.paid_at)}</span>
                        <span className="font-medium tabular-nums">
                          {legacyPaymentDelta.toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Ранее учтено</p>
                    </div>
                  ) : null}
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-md border border-border bg-muted/20 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span>{toDisplayDate(payment.paid_at)}</span>
                        <span className="font-medium tabular-nums">
                          {payment.amount_rub.toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                      {payment.note ? (
                        <p className="mt-1 text-xs text-muted-foreground">{payment.note}</p>
                      ) : null}
                      <CancelPaymentButton
                        requestId={row.id}
                        paymentId={payment.id}
                        onCancelPayment={onCancelPayment}
                      />
                    </div>
                  ))}
                </div>
              ) : paidAmount > 0 ? (
                <div className="mt-2 rounded-md border border-border bg-muted/20 px-3 py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>{toDisplayDate(row.paid_at)}</span>
                    <span className="font-medium tabular-nums">
                      {paidAmount.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Ранее учтено</p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Оплат пока нет.</p>
              )}
            </div>
          </div>

          <ManagerRequestActionsForm
            key={`${row.id}-${row.updated_at}`}
            row={row}
            financeGroups={financeGroups}
            onUpdate={onUpdate}
            onAddPayment={onAddPayment}
            canSoftDelete={canSoftDelete}
            onSoftDelete={onSoftDelete}
          />
        </div>
      </details>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-balance text-xs text-zinc-500">{label}</p>
      <p className="text-sm">{value}</p>
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
