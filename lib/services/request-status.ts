import { resolvePaidFields, resolvePaymentStatus } from "@/lib/helpers/payment-request"
import type { PaymentRequestStatus } from "@/lib/types"

export function markAsPaid(paidAt?: string | null): {
  is_paid: boolean
  paid_at: string | null
  status: PaymentRequestStatus
} {
  const paid = resolvePaidFields(true, paidAt)
  return {
    is_paid: paid.is_paid,
    paid_at: paid.paid_at,
    status: "paid",
  }
}

export function markAsUnpaid(): {
  is_paid: boolean
  paid_at: string | null
  status: PaymentRequestStatus
} {
  return {
    is_paid: false,
    paid_at: null,
    status: "in_progress",
  }
}

export function deriveStatus(
  currentStatus: PaymentRequestStatus | null | undefined,
  isPaid: boolean,
): PaymentRequestStatus {
  if (isPaid) return "paid"
  return resolvePaymentStatus(currentStatus, false)
}

