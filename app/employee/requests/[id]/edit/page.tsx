type EmployeeRequestEditPageProps = {
  params: Promise<{ id: string }>
}

import { notFound } from "next/navigation"
import { PaymentRequestForm } from "@/components/employee/payment-request-form"
import { updatePaymentRequestAction } from "@/app/employee/requests/actions"
import {
  getFinanceGroups,
  getMyPaymentRequestById,
} from "@/lib/data/payment-requests"

export default async function EmployeeRequestEditPage({
  params,
}: EmployeeRequestEditPageProps) {
  const { id } = await params
  const [request, financeGroups] = await Promise.all([
    getMyPaymentRequestById(id),
    getFinanceGroups(),
  ])

  if (!request) notFound()

  const submitAction = updatePaymentRequestAction.bind(null, id)

  return (
    <section>
      <h1>Редактирование заявки</h1>
      <p className="page-lead">
        ID заявки: <span className="font-medium text-foreground">{id}</span>
      </p>
      <div className="mt-5 rounded-xl border border-border bg-muted/15 p-5 shadow-sm">
        <PaymentRequestForm
          key={`${request.id}-${request.updated_at}`}
          mode="edit"
          financeGroups={financeGroups}
          initialValues={request}
          readOnly={request.is_paid}
          onSubmitAction={submitAction}
        />
      </div>
    </section>
  )
}

