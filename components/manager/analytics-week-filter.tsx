"use client"

type WeekOption = {
  key: string
  label: string
}

type AnalyticsWeekFilterProps = {
  groupBy: string
  search: string
  isPaid: string
  financeGroupId: string
  summarySort: string
  weekKey: string
  weekOptions: WeekOption[]
}

export function AnalyticsWeekFilter({
  groupBy,
  search,
  isPaid,
  financeGroupId,
  summarySort,
  weekKey,
  weekOptions,
}: AnalyticsWeekFilterProps) {
  return (
    <form className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="groupBy" value={groupBy} />
      <input type="hidden" name="search" value={search} />
      <input type="hidden" name="isPaid" value={isPaid} />
      <input type="hidden" name="financeGroupId" value={financeGroupId} />
      <input type="hidden" name="summarySort" value={summarySort} />
      <select
        name="weekKey"
        defaultValue={weekKey}
        className="rounded-md border px-3 py-2 text-sm"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="">Неделя: все</option>
        {weekOptions.map((week) => (
          <option key={week.key} value={week.key}>
            {week.label}
          </option>
        ))}
      </select>
    </form>
  )
}

