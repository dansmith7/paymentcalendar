export const USER_ROLES = ["employee", "manager", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const PAYMENT_REQUEST_STATUSES = ["in_progress", "rejected", "paid"] as const
export type PaymentRequestStatus = (typeof PAYMENT_REQUEST_STATUSES)[number]

export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export type FinanceGroup = {
  id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export type PaymentRequest = {
  id: string
  applicant_id: string
  applicant_name: string
  applicant_email?: string | null
  request_date: string
  amount_rub: number
  payment_recipient: string
  payment_purpose: string
  desired_payment_date: string
  critical_payment_date: string | null
  finance_group_id: string | null
  finance_group_name: string | null
  planned_payment_date: string | null
  is_paid: boolean
  paid_at: string | null
  status: PaymentRequestStatus
  sync_status: "pending" | "synced" | "failed" | null
  external_id: string | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
  /** Если задано — заявка скрыта из выборок (мягкое удаление), строка в БД остаётся */
  deleted_at?: string | null
}
