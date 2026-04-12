import { managerUpdatePaymentRequestAction } from "@/app/manager/requests/actions"
import { ManagerTeamRequestsPanel } from "@/components/manager/manager-team-requests-panel"
import { getAllPaymentRequests, getFinanceGroups } from "@/lib/data/payment-requests"

export default async function ManagerRequestsPage() {
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
          onUpdate={managerUpdatePaymentRequestAction}
        />
      </div>
    </section>
  )
}
