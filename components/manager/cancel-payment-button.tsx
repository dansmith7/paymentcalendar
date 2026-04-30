"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"

type CancelPaymentButtonProps = {
  requestId: string
  paymentId: string
  onCancelPayment: (id: string, paymentId: string) => Promise<void> | void
}

export function CancelPaymentButton({
  requestId,
  paymentId,
  onCancelPayment,
}: CancelPaymentButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCancel() {
    if (!needsConfirm) {
      setNeedsConfirm(true)
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await onCancelPayment(requestId, paymentId)
        setNeedsConfirm(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось отменить оплату")
      }
    })
  }

  return (
    <div className="mt-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleCancel}
        className="h-8 border-red-200 px-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
      >
        {isPending ? "Отмена..." : needsConfirm ? "Подтвердить" : "Отменить"}
      </Button>
      {needsConfirm && !isPending ? (
        <p className="mt-1 text-xs text-muted-foreground">Сумма перестанет учитываться в остатке.</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  )
}
