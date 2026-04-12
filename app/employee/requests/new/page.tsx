import { PaymentRequestForm } from "@/components/employee/payment-request-form"
import { getFinanceGroups } from "@/lib/data/payment-requests"
import { createPaymentRequestAction } from "@/app/employee/requests/actions"

export default async function EmployeeRequestNewPage() {
  const financeGroups = await getFinanceGroups()

  return (
    <section>
      <h1>Новая заявка</h1>
      <p className="page-lead">Заполните поля и отправьте заявку.</p>
      <div className="mt-5 rounded-xl border border-border bg-muted/15 p-5 shadow-sm">
        <PaymentRequestForm
          mode="create"
          financeGroups={financeGroups}
          onSubmitAction={createPaymentRequestAction}
        />
      </div>
    </section>
  )
}

