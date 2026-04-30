import {
  addPaymentToPaymentRequestAction,
  adminSoftDeletePaymentRequestAction,
  cancelPaymentRequestPaymentAction,
  managerUpdatePaymentRequestAction,
} from "@/app/(main)/manager/requests/actions"
import { ManagerTeamRequestsPanel } from "@/components/manager/manager-team-requests-panel"
import { getCurrentSession } from "@/lib/auth/session"
import { getAllPaymentRequests, getFinanceGroups } from "@/lib/data/payment-requests"

export default async function ManagerRequestsPage() {
  const session = await getCurrentSession()
  const [rows, groups] = await Promise.all([
    getAllPaymentRequests({}),
    getFinanceGroups(),
  ])

  return (
    <section>
      <h1>Заявки команды</h1>
      <p className="page-lead">
        Поиск и группировка по неделям; действия руководителя по оплате без изменений.
      </p>

      <div className="mt-8">
        <ManagerTeamRequestsPanel
          rows={rows}
          financeGroups={groups}
          currentRole={session.role}
          onUpdate={managerUpdatePaymentRequestAction}
          onAddPayment={addPaymentToPaymentRequestAction}
          onCancelPayment={cancelPaymentRequestPaymentAction}
          onSoftDelete={adminSoftDeletePaymentRequestAction}
        />
      </div>
    </section>
  )
}
