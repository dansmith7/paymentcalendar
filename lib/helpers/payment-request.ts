import { format, parseISO } from "date-fns"
import type {
  PaymentRequest,
  PaymentRequestStatus,
} from "@/lib/types"

type FormReadyPaymentRequest = {
  id?: string
  applicant_name: string
  request_date: string
  amount_rub: number
  payment_recipient: string
  payment_purpose: string
  desired_payment_date: string
  critical_payment_date: string | null
  finance_group_id: string | null
  finance_group_name: string | null
  planned_payment_date: string | null
  status: PaymentRequestStatus
  is_paid: boolean
  paid_at: string | null
}

function toIsoDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  if (typeof date === "string") {
    const trimmed = date.trim()
    return trimmed.length > 0 ? trimmed.slice(0, 10) : null
  }
  return format(date, "yyyy-MM-dd")
}

export function toDisplayDate(value: string | null | undefined): string {
  if (!value) return "-"
  const parsed = parseISO(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return format(parsed, "dd.MM.yyyy")
}

export function resolvePaymentStatus(
  status: PaymentRequestStatus | null | undefined,
  isPaid: boolean,
): PaymentRequestStatus {
  if (isPaid) return "paid"
  if (status === "rejected") return "rejected"
  return "in_progress"
}

export function resolvePaidFields(
  isPaid: boolean,
  paidAt?: string | null,
): { is_paid: boolean; paid_at: string | null } {
  if (!isPaid) {
    return { is_paid: false, paid_at: null }
  }

  return {
    is_paid: true,
    paid_at: toIsoDate(paidAt) ?? toIsoDate(new Date()),
  }
}

export function toFormDefaults(
  request?: Partial<PaymentRequest> | null,
): FormReadyPaymentRequest {
  const isPaid = Boolean(request?.is_paid)
  const status = resolvePaymentStatus(request?.status, isPaid)
  const paidFields = resolvePaidFields(isPaid, request?.paid_at ?? null)

  return {
    id: request?.id,
    applicant_name: request?.applicant_name ?? "",
    request_date: toIsoDate(request?.request_date) ?? toIsoDate(new Date())!,
    amount_rub: request?.amount_rub ?? 0,
    payment_recipient: request?.payment_recipient ?? "",
    payment_purpose: request?.payment_purpose ?? "",
    desired_payment_date: toIsoDate(request?.desired_payment_date) ?? toIsoDate(new Date())!,
    critical_payment_date: toIsoDate(request?.critical_payment_date),
    finance_group_id: request?.finance_group_id ?? null,
    finance_group_name: request?.finance_group_name ?? null,
    planned_payment_date: toIsoDate(request?.planned_payment_date),
    status,
    is_paid: paidFields.is_paid,
    paid_at: paidFields.paid_at,
  }
}

export function normalizeRequestForSave(
  payload: FormReadyPaymentRequest,
): FormReadyPaymentRequest {
  const paidFields = resolvePaidFields(payload.is_paid, payload.paid_at)

  return {
    ...payload,
    request_date: toIsoDate(payload.request_date) ?? toIsoDate(new Date())!,
    desired_payment_date: toIsoDate(payload.desired_payment_date) ?? toIsoDate(new Date())!,
    critical_payment_date: toIsoDate(payload.critical_payment_date),
    planned_payment_date: toIsoDate(payload.planned_payment_date),
    status: resolvePaymentStatus(payload.status, paidFields.is_paid),
    is_paid: paidFields.is_paid,
    paid_at: paidFields.paid_at,
  }
}

export type { FormReadyPaymentRequest }
