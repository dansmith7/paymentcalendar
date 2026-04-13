"use client"

import { Button } from "@/components/ui/button"

export default function EmployeeRequestsError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <p className="font-medium">Не удалось загрузить заявки сотрудника.</p>
      <p className="mt-1">{error.message}</p>
      <Button onClick={reset} variant="outline" className="mt-3">
        Повторить
      </Button>
    </div>
  )
}

