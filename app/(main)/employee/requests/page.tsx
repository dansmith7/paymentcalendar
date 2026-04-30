import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { duplicatePaymentRequestAction } from "@/app/(main)/employee/requests/actions"
import { getFinanceGroups, getMyPaymentRequests } from "@/lib/data/payment-requests"
import { MyRequestsTable } from "@/components/employee/my-requests-table"
import { buildWeekFilterOptions } from "@/lib/helpers/week-filter"

type EmployeeRequestsPageProps = {
  searchParams: Promise<{
    search?: string
    isPaid?: "all" | "paid" | "unpaid"
    financeGroupId?: string
    weekKey?: string
    sort?: "request_date_asc" | "request_date_desc"
    submitted?: string
  }>
}

export default async function EmployeeRequestsPage({
  searchParams,
}: EmployeeRequestsPageProps) {
  const params = await searchParams
  const filters = {
    search: params.search ?? "",
    isPaid: params.isPaid ?? "all",
    financeGroupId: params.financeGroupId ?? "",
    weekKey: params.weekKey ?? "",
    sort: params.sort ?? "request_date_desc",
  } as const
  const showSubmittedBanner = params.submitted === "1" || params.submitted === "true"
  const showCopyBanner = params.submitted === "copy"

  const baseFilters = {
    search: filters.search,
    isPaid: filters.isPaid,
    financeGroupId: filters.financeGroupId,
    sort: filters.sort,
  } as const

  const [rows, allRowsForWeeks, groups] = await Promise.all([
    getMyPaymentRequests(filters),
    getMyPaymentRequests(baseFilters),
    getFinanceGroups(),
  ])
  const weekOptions = buildWeekFilterOptions(allRowsForWeeks)

  return (
    <section>
      <h1>Мои заявки</h1>
      <p className="page-lead">Список ваших платежных заявок.</p>

      {showSubmittedBanner || showCopyBanner ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3.5 text-[0.9375rem] text-emerald-950 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-100">
          <p className="font-semibold">
            {showCopyBanner ? "Копия заявки создана." : "Ваша заявка отправлена."}
          </p>
          <Link
            href="/employee/requests"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Скрыть
          </Link>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/employee/requests/new" className={buttonVariants({ variant: "default" })}>
          Создать заявку
        </Link>
      </div>

      <form className="mt-5 grid gap-3 rounded-xl border border-border bg-muted/20 p-4 md:grid-cols-4">
        <input
          name="search"
          defaultValue={filters.search}
          placeholder="Поиск по получателю/назначению"
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
          name="weekKey"
          defaultValue={filters.weekKey}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
        >
          <option value="">Неделя: все</option>
          {weekOptions.map((week) => (
            <option key={week.key} value={week.key}>
              {week.label}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={filters.sort}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm"
        >
          <option value="request_date_desc">Дата заявки: новые сверху</option>
          <option value="request_date_asc">Дата заявки: старые сверху</option>
        </select>
        <Button type="submit" variant="outline" className="md:col-span-4">
          Применить фильтры
        </Button>
      </form>

      <div className="mt-4">
        <MyRequestsTable rows={rows} onDuplicate={duplicatePaymentRequestAction} />
      </div>
    </section>
  )
}
