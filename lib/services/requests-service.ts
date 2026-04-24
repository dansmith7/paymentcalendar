import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentSession } from "@/lib/auth/session"
import type { FinanceGroup, PaymentRequest, Profile } from "@/lib/types"
import {
  createPaymentRequestSchema,
  managerUpdatePaymentRequestSchema,
  updatePaymentRequestSchema,
} from "@/lib/schemas/payment-request"
import { toWeekFilterKey } from "@/lib/helpers/week-filter"
import { markAsPaid, markAsUnpaid } from "@/lib/services/request-status"
import {
  fetchAllRequests,
  fetchFinanceGroups,
  fetchMyRequests,
  fetchRequestById,
  findAnyProfile,
  findFinanceGroupName,
  findProfileByEmail,
  findProfileByRole,
  insertProfile,
  insertRequest,
  updateOwnRequestById,
  updateRequestById,
  type ManagerRequestsFilters,
  type MyRequestsFilters,
} from "@/lib/repositories/requests-repository"

export type { ManagerRequestsFilters, MyRequestsFilters }

async function getSupabaseForData() {
  const session = await getCurrentSession()
  if (session.source === "mock") return createAdminClient()
  return createClient()
}

async function getCurrentProfile(): Promise<Profile> {
  const session = await getCurrentSession()
  if (!session.user) throw new Error("Unauthorized")
  if (session.source !== "mock") return session.user
  return ensureMockProfile(session.user)
}

async function ensureMockProfile(mockUser: Profile): Promise<Profile> {
  const admin = createAdminClient()
  const existingByEmail = await findProfileByEmail(admin, mockUser.email)
  if (existingByEmail) return existingByEmail as Profile

  const createAuthUser = await admin.auth.admin.createUser({
    email: mockUser.email,
    password: `DevMock-${randomUUID()}-Aa1!`,
    email_confirm: true,
    user_metadata: { full_name: mockUser.full_name, role: mockUser.role },
  })

  if (createAuthUser.error || !createAuthUser.data.user) {
    const byRole = await findProfileByRole(admin, mockUser.role)
    if (byRole) return byRole as Profile
    const anyProfile = await findAnyProfile(admin)
    if (anyProfile) return anyProfile as Profile
    throw new Error(createAuthUser.error?.message ?? "Failed to resolve profile in mock mode")
  }

  const authUserId = createAuthUser.data.user.id
  await insertProfile(admin, {
    id: authUserId,
    email: mockUser.email,
    full_name: mockUser.full_name,
    role: mockUser.role,
  })

  return {
    id: authUserId,
    email: mockUser.email,
    full_name: mockUser.full_name,
    role: mockUser.role,
    created_at: new Date().toISOString(),
  }
}

function assertMandatoryFields(payload: {
  amount_rub?: number
  payment_recipient?: string
  payment_purpose?: string
  desired_payment_date?: string
  critical_payment_date?: string | null
}) {
  if (!payload.amount_rub || payload.amount_rub <= 0) {
    throw new Error("Сумма должна быть больше 0")
  }
  if (!payload.payment_recipient?.trim()) throw new Error("Поле 'Получатель' обязательно")
  if (!payload.payment_purpose?.trim()) throw new Error("Поле 'Назначение' обязательно")
  if (!payload.desired_payment_date) throw new Error("Поле 'Желаемая дата оплаты' обязательно")
  if (!payload.critical_payment_date) throw new Error("Поле 'Критичная дата оплаты' обязательно")
}

export async function getFinanceGroupsService(): Promise<FinanceGroup[]> {
  const db = await getSupabaseForData()
  return fetchFinanceGroups(db)
}

export async function getMyRequests(filters: MyRequestsFilters): Promise<PaymentRequest[]> {
  const db = await getSupabaseForData()
  const profile = await getCurrentProfile()
  const rows = await fetchMyRequests(db, profile.id, filters)
  if (!filters.weekKey) return rows
  return rows.filter((row) => toWeekFilterKey(row.desired_payment_date) === filters.weekKey)
}

export async function getAllRequests(
  filters: ManagerRequestsFilters,
): Promise<PaymentRequest[]> {
  const session = await getCurrentSession()
  if (session.role !== "manager") throw new Error("Недостаточно прав")
  const db = await getSupabaseForData()
  const rows = await fetchAllRequests(db, filters)
  if (!filters.weekKey) return rows
  return rows.filter((row) => toWeekFilterKey(row.desired_payment_date) === filters.weekKey)
}

export async function getOwnRequestById(id: string): Promise<PaymentRequest | null> {
  const db = await getSupabaseForData()
  const profile = await getCurrentProfile()
  const row = await fetchRequestById(db, id)
  if (!row || row.applicant_id !== profile.id) return null
  return row
}

export async function createRequest(input: unknown): Promise<void> {
  const db = await getSupabaseForData()
  const profile = await getCurrentProfile()
  if (!["employee", "manager", "admin"].includes(profile.role)) {
    throw new Error("Недостаточно прав для создания заявки")
  }
  const payload = createPaymentRequestSchema.parse(input)
  assertMandatoryFields(payload)
  const financeGroupName = await findFinanceGroupName(db, payload.finance_group_id)

  await insertRequest(db, {
    applicant_id: profile.id,
    applicant_name: profile.full_name,
    applicant_email: profile.email,
    request_date: new Date().toISOString().slice(0, 10),
    amount_rub: payload.amount_rub,
    payment_recipient: payload.payment_recipient,
    payment_purpose: payload.payment_purpose,
    desired_payment_date: payload.desired_payment_date,
    critical_payment_date: payload.critical_payment_date,
    finance_group_id: payload.finance_group_id,
    finance_group_name: financeGroupName ?? payload.finance_group_name ?? null,
    is_paid: false,
    status: "in_progress",
  })
}

export async function updateOwnRequest(id: string, input: unknown): Promise<void> {
  const db = await getSupabaseForData()
  const profile = await getCurrentProfile()
  const payload = updatePaymentRequestSchema.parse({
    ...(typeof input === "object" && input !== null ? input : {}),
    id,
  })
  const existing = await fetchRequestById(db, id)

  if (!existing) throw new Error("Заявка не найдена")
  if (existing.applicant_id !== profile.id) throw new Error("Недостаточно прав")
  if (existing.is_paid) throw new Error("Оплаченные заявки нельзя редактировать")

  const merged = {
    amount_rub: payload.amount_rub ?? existing.amount_rub,
    payment_recipient: payload.payment_recipient ?? existing.payment_recipient,
    payment_purpose: payload.payment_purpose ?? existing.payment_purpose,
    desired_payment_date: payload.desired_payment_date ?? existing.desired_payment_date,
    critical_payment_date: payload.critical_payment_date ?? existing.critical_payment_date,
  }
  assertMandatoryFields(merged)

  const financeGroupId = payload.finance_group_id ?? existing.finance_group_id
  const financeGroupName = await findFinanceGroupName(db, financeGroupId)

  await updateOwnRequestById(db, id, profile.id, {
    amount_rub: merged.amount_rub,
    payment_recipient: merged.payment_recipient,
    payment_purpose: merged.payment_purpose,
    desired_payment_date: merged.desired_payment_date,
    critical_payment_date: merged.critical_payment_date,
    finance_group_id: financeGroupId,
    finance_group_name: financeGroupName ?? payload.finance_group_name ?? null,
  })
}

export async function updateManagerFields(id: string, input: unknown): Promise<void> {
  const session = await getCurrentSession()
  if (session.role !== "manager") throw new Error("Недостаточно прав")

  const db = await getSupabaseForData()
  const existing = await fetchRequestById(db, id)
  if (!existing) throw new Error("Заявка не найдена")

  const payload = managerUpdatePaymentRequestSchema.parse({
    ...(typeof input === "object" && input !== null ? input : {}),
    id,
  })
  const financeGroupId = payload.finance_group_id ?? existing.finance_group_id
  const financeGroupName = await findFinanceGroupName(db, financeGroupId)
  const nextStatus = payload.status ?? existing.status
  let paid = markAsUnpaid()

  if (nextStatus === "paid") {
    paid = markAsPaid(payload.paid_at ?? existing.paid_at)
  }

  await updateRequestById(db, id, {
    is_paid: paid.is_paid,
    paid_at: paid.paid_at,
    status: nextStatus === "paid" ? paid.status : nextStatus,
    planned_payment_date: payload.planned_payment_date ?? existing.planned_payment_date,
    finance_group_id: financeGroupId,
    finance_group_name: financeGroupName ?? payload.finance_group_name ?? existing.finance_group_name ?? null,
  })
}

