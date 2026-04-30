import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  getPaidAmountRub,
  getRemainingAmountRub,
  isPaymentStarted,
  toDisplayDate,
} from "@/lib/helpers/payment-request"
import { FINANCE_GROUP_FIELD_LABEL } from "@/lib/ui-labels"
import type { PaymentRequest } from "@/lib/types"

type MyRequestsTableProps = {
  rows: PaymentRequest[]
  onDuplicate: (id: string) => Promise<void>
}

export function MyRequestsTable({ rows, onDuplicate }: MyRequestsTableProps) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-border p-4 text-[0.9375rem] text-muted-foreground">
        Заявок пока нет.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="min-w-full text-[0.9375rem]">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <Th>Дата заявки</Th>
            <Th>Сумма</Th>
            <Th>Получатель</Th>
            <Th>Назначение</Th>
            <Th>Желаемая дата</Th>
            <Th>Критичная дата</Th>
            <Th>Планируемая дата</Th>
            <Th>Оплачено</Th>
            <Th>Сумма оплачено</Th>
            <Th>Остаток</Th>
            <Th>Статус</Th>
            <Th className="max-w-[11rem] text-balance">{FINANCE_GROUP_FIELD_LABEL}</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t align-top">
              <Td>{toDisplayDate(row.request_date)}</Td>
              <Td title={row.amount_rub.toLocaleString("ru-RU")}>
                {row.amount_rub.toLocaleString("ru-RU", {
                  maximumFractionDigits: 2,
                })}{" "}
                ₽
              </Td>
              <Td>{row.payment_recipient}</Td>
              <Td className="max-w-72">{row.payment_purpose}</Td>
              <Td>{toDisplayDate(row.desired_payment_date)}</Td>
              <Td>{toDisplayDate(row.critical_payment_date)}</Td>
              <Td>{toDisplayDate(row.planned_payment_date)}</Td>
              <Td>{row.is_paid ? "Да" : "Нет"}</Td>
              <Td>
                {isPaymentStarted(row)
                  ? `${getPaidAmountRub(row).toLocaleString("ru-RU")} ₽`
                  : "-"}
              </Td>
              <Td>{`${getRemainingAmountRub(row).toLocaleString("ru-RU")} ₽`}</Td>
              <Td>{statusLabel(row.status)}</Td>
              <Td>{row.finance_group_name ?? "-"}</Td>
              <Td className="min-w-36">
                <Link
                  href={`/employee/requests/${row.id}/edit`}
                  className={buttonVariants({ size: "xs", variant: "outline" })}
                >
                  {isPaymentStarted(row) ? "Просмотр" : "Редактировать"}
                </Link>
                <form action={onDuplicate.bind(null, row.id)} className="mt-2">
                  <button
                    type="submit"
                    className={buttonVariants({ size: "xs", variant: "outline" })}
                  >
                    Сделать копию
                  </button>
                </form>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
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

function Th({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={`px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  className,
  title,
}: {
  children?: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <td title={title} className={`px-3 py-2.5 text-center align-top ${className ?? ""}`}>
      {children}
    </td>
  )
}
