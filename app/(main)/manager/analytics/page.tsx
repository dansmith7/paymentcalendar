import { getAllPaymentRequests, getFinanceGroups } from "@/lib/data/payment-requests"
import { Button } from "@/components/ui/button"
import { AnalyticsWeekFilter } from "@/components/manager/analytics-week-filter"
import { AnalyticsBulkSelector } from "@/components/manager/analytics-bulk-selector"
import { buildAnalyticsDashboardScores } from "@/lib/helpers/analytics-dashboard"
import {
  buildWeeklySummary,
  getWeekKeyFromDate,
  getWeekLabelForDateString,
  sortWeeklyBlocks,
  type WeeklyGroupingField,
  type WeeklySummarySort,
} from "@/lib/helpers/weekly-summary"

type ManagerAnalyticsPageProps = {
  searchParams: Promise<{
    groupBy?: WeeklyGroupingField
    weekKey?: string
    summarySort?: WeeklySummarySort
    search?: string
    isPaid?: "all" | "paid" | "unpaid"
    financeGroupId?: string
  }>
}

export default async function ManagerAnalyticsPage({
  searchParams,
}: ManagerAnalyticsPageProps) {
  const params = await searchParams
  const groupBy = toGroupingField(params.groupBy)
  const weekKey = (params.weekKey ?? "").trim()
  const summarySort = toSummarySort(params.summarySort)
  const filters = {
    search: params.search ?? "",
    isPaid: params.isPaid ?? "all",
    financeGroupId: params.financeGroupId ?? "",
    sort: "request_date_desc" as const,
  }

  const [rows, groups] = await Promise.all([
    getAllPaymentRequests(filters),
    getFinanceGroups(),
  ])
  const fullSummary = buildWeeklySummary(rows, groupBy)
  const weekOptions = fullSummary.blocks.map((block) => ({
    key: block.weekKey,
    label: block.weekLabel,
  }))
  const scopedRows = weekKey
    ? rows.filter((row) => getWeekKeyFromDate(row[groupBy]) === weekKey)
    : rows
  const summary = buildWeeklySummary(scopedRows, groupBy)
  const sortedBlocks = sortWeeklyBlocks(summary.blocks, summarySort)
  const dashboard = buildAnalyticsDashboardScores(rows, new Date(), weekKey || null)
  const selectedWeekLabel = weekKey
    ? (weekOptions.find((w) => w.key === weekKey)?.label ?? `Неделя (${weekKey})`)
    : null
  const currentWeekLabel =
    selectedWeekLabel ?? getWeekLabelForDateString(dashboard.referenceDateStr)
  const dashboardWeekScope = weekKey.trim() !== "" ? "selected" : "today"

  return (
    <section>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1>Аналитика</h1>
        <AnalyticsWeekFilter
          groupBy={groupBy}
          search={filters.search}
          isPaid={filters.isPaid}
          financeGroupId={filters.financeGroupId}
          summarySort={summarySort}
          weekKey={weekKey}
          weekOptions={weekOptions}
        />
      </div>
      <p className="page-lead">Сводка по текущей неделе и детализация по отфильтрованным заявкам.</p>

      <div className="mt-5 space-y-3">
        {currentWeekLabel ? (
          <p className="text-sm text-muted-foreground">
            {dashboardWeekScope === "selected" ? "Неделя в фильтре:" : "Текущая календарная неделя:"}{" "}
            <span className="font-medium text-foreground">{currentWeekLabel}</span>
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Не критичные заявки"
            value={formatRub(dashboard.nonCriticalDesiredThisWeek.amount)}
            subtitle={
              dashboardWeekScope === "selected"
                ? `Желаемая дата оплаты — выбранная неделя · ${dashboard.nonCriticalDesiredThisWeek.count} заявок`
                : `Желаемая дата оплаты — эта неделя · ${dashboard.nonCriticalDesiredThisWeek.count} заявок`
            }
          />
          <MetricCard
            title="Критические заявки"
            value={formatRub(dashboard.criticalThisWeek.amount)}
            subtitle={
              dashboardWeekScope === "selected"
                ? `Критичная дата оплаты — выбранная неделя · ${dashboard.criticalThisWeek.count} заявок`
                : `Критичная дата оплаты — эта неделя · ${dashboard.criticalThisWeek.count} заявок`
            }
          />
          <MetricCard
            title="Оплаченные заявки"
            value={formatRub(dashboard.paid.amount)}
            subtitle={
              dashboardWeekScope === "selected"
                ? `Оплачено, желаемая дата в выбранной неделе · ${dashboard.paid.count} заявок`
                : `${dashboard.paid.count} заявок (все оплаченные в выборке)`
            }
          />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Если у заявки и желаемая, и критичная дата попадают на одну и ту же неделю, в карточках она учитывается
          только в «Критических».
        </p>
      </div>

      <form className="mt-6 grid gap-3 rounded-xl border border-border bg-muted/20 p-4 md:grid-cols-4">
        <select
          name="groupBy"
          defaultValue={groupBy}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
        >
          <option value="desired_payment_date">Группировать по желаемой дате</option>
          <option value="critical_payment_date">Группировать по критичной дате</option>
          <option value="planned_payment_date">Группировать по планируемой дате</option>
        </select>
        <input
          name="search"
          defaultValue={filters.search}
          placeholder="Поиск по заявкам"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
        />
        <select
          name="isPaid"
          defaultValue={filters.isPaid}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
        >
          <option value="all">Оплата: все</option>
          <option value="paid">Только оплаченные</option>
          <option value="unpaid">Только неоплаченные</option>
        </select>
        <select
          name="financeGroupId"
          defaultValue={filters.financeGroupId}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
        >
          <option value="">Группа: все</option>
          {!groups.length ? <option value="">Справочник групп пуст</option> : null}
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <select
          name="summarySort"
          defaultValue={summarySort}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
        >
          <option value="week_asc">Сортировка недель: сначала ранние</option>
          <option value="week_desc">Сортировка недель: сначала поздние</option>
          <option value="total_desc">Сумма всего: по убыванию</option>
          <option value="total_asc">Сумма всего: по возрастанию</option>
          <option value="paid_desc">Сумма оплачено: по убыванию</option>
          <option value="paid_asc">Сумма оплачено: по возрастанию</option>
          <option value="unpaid_desc">Сумма не оплачено: по убыванию</option>
          <option value="unpaid_asc">Сумма не оплачено: по возрастанию</option>
        </select>
        <input type="hidden" name="weekKey" value={weekKey} />
        <Button type="submit" variant="outline" className="md:col-span-4">
          Пересчитать сводку
        </Button>
      </form>

      {process.env.NODE_ENV !== "production" ? <AnalyticsBulkSelector rows={scopedRows} /> : null}

      {!summary.blocks.length ? (
        <div className="mt-4 rounded-xl border border-border p-4 text-[0.9375rem] text-muted-foreground">
          По текущим фильтрам нет данных для недельной группировки.
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="min-w-full text-[0.9375rem]">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Неделя
              </th>
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Всего
              </th>
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Оплачено
              </th>
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Не оплачено
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBlocks.map((block) => (
              <tr key={block.weekKey} className="border-t">
                <td className="px-3 py-2.5">{block.weekLabel}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatRub(block.totalAmount)}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatRub(block.paidAmount)}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatRub(block.unpaidAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function toGroupingField(value: string | undefined): WeeklyGroupingField {
  if (value === "critical_payment_date") return value
  if (value === "planned_payment_date") return value
  return "desired_payment_date"
}

function toSummarySort(value: string | undefined): WeeklySummarySort {
  if (value === "week_desc") return value
  if (value === "total_desc") return value
  if (value === "total_asc") return value
  if (value === "paid_desc") return value
  if (value === "paid_asc") return value
  if (value === "unpaid_desc") return value
  if (value === "unpaid_asc") return value
  return "week_asc"
}

function formatRub(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-muted/25 p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground md:text-[1.65rem]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">{subtitle}</p>
    </div>
  )
}

