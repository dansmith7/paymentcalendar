import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentSession } from "@/lib/auth/session"
import { assertSupabaseWritesAllowed } from "@/lib/dev-write-guard"
import type { FinanceGroup, PaymentRequest, Profile } from "@/lib/types"
import {
  addPaymentRequestPaymentSchema,
  createPaymentRequestSchema,
  managerUpdatePaymentRequestSchema,
  updatePaymentRequestSchema,
} from "@/lib/schemas/payment-request"
import { derivePaymentStatusFromAmounts, getPaidAmountRub } from "@/lib/helpers/payment-request"
import { toWeekFilterKey } from "@/lib/helpers/week-filter"
import {
  cancelPaymentById,
  fetchAllRequests,
  fetchFinanceGroups,
  fetchMyRequests,
  fetchPaymentsForRequests,
  fetchRequestById,
  findFinanceGroupName,
  insertPayment,
  insertRequest,
  softDeleteRequestById,
  updateOwnRequestById,
  updateRequestById,
  type ManagerRequestsFilters,
  type MyRequestsFilters,
} from "@/lib/repositories/requests-repository"
import {
  cancelMockPaymentById,
  fetchMockAllRequests,
  fetchMockFinanceGroups,
  fetchMockMyRequests,
  fetchMockRequestById,
  findMockFinanceGroupName,
  insertMockPayment,
  insertMockRequest,
  softDeleteMockRequestById,
  updateMockRequestById,
  updateOwnMockRequestById,
} from "@/lib/repositories/mock-requests-repository"

export type { ManagerRequestsFilters, MyRequestsFilters }

async function getSupabaseForData() {
  const session = await getCurrentSession()
  if (session.source === "mock") {
    throw new Error("Supabase недоступен в mock-режиме: используется локальная dev-песочница.")
  }
  // In real auth mode managers/admins work with team-wide data and manager actions.
  // Use service-role client for server-side operations to avoid RLS mismatches between roles and app flows.
  if (session.role === "manager" || session.role === "admin") return createAdminClient()
  return createClient()
}

async function getCurrentProfile(): Promise<Profile> {
  const session = await getCurrentSession()
  if (!session.user) throw new Error("Unauthorized")
  return session.user
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

async function attachSupabasePayments(
  db: Awaited<ReturnType<typeof getSupabaseForData>>,
  rows: PaymentRequest[],
): Promise<PaymentRequest[]> {
  const payments = await fetchPaymentsForRequests(db, rows.map((row) => row.id))
  return rows.map((row) => {
    const withPayments = {
      ...row,
      payments: payments.filter((payment) => payment.request_id === row.id),
    }
    return {
      ...withPayments,
      paid_amount_rub: getPaidAmountRub(withPayments),
      is_paid: derivePaymentStatusFromAmounts(withPayments) === "paid",
      status: derivePaymentStatusFromAmounts(withPayments),
    }
  })
}

export async function getFinanceGroupsService(): Promise<FinanceGroup[]> {
  const session = await getCurrentSession()
  if (session.source === "mock") return fetchMockFinanceGroups()

  const db = await getSupabaseForData()
  return fetchFinanceGroups(db)
}

export async function getMyRequests(filters: MyRequestsFilters): Promise<PaymentRequest[]> {
  const session = await getCurrentSession()
  const profile = await getCurrentProfile()
  let rows: PaymentRequest[]
  if (session.source === "mock") {
    rows = await fetchMockMyRequests(profile.id, filters)
  } else {
    const db = await getSupabaseForData()
    rows = await attachSupabasePayments(db, await fetchMyRequests(db, profile.id, filters))
  }
  if (!filters.weekKey) return rows
  return rows.filter((row) => toWeekFilterKey(row.desired_payment_date) === filters.weekKey)
}

export async function getAllRequests(
  filters: ManagerRequestsFilters,
): Promise<PaymentRequest[]> {
  const session = await getCurrentSession()
  if (session.role !== "manager" && session.role !== "admin") throw new Error("Недостаточно прав")
  let rows: PaymentRequest[]
  if (session.source === "mock") {
    rows = await fetchMockAllRequests(filters)
  } else {
    const db = await getSupabaseForData()
    rows = await attachSupabasePayments(db, await fetchAllRequests(db, filters))
  }
  if (!filters.weekKey) return rows
  return rows.filter((row) => toWeekFilterKey(row.desired_payment_date) === filters.weekKey)
}

export async function getOwnRequestById(id: string): Promise<PaymentRequest | null> {
  const session = await getCurrentSession()
  const profile = await getCurrentProfile()
  let row: PaymentRequest | null
  if (session.source === "mock") {
    row = await fetchMockRequestById(id)
  } else {
    const db = await getSupabaseForData()
    const existing = await fetchRequestById(db, id)
    row = existing ? (await attachSupabasePayments(db, [existing]))[0] : null
  }
  if (!row || row.applicant_id !== profile.id) return null
  return row
}

export async function createRequest(input: unknown): Promise<void> {
  const session = await getCurrentSession()
  if (session.source !== "mock") assertSupabaseWritesAllowed("Создание заявки")
  const db = session.source === "mock" ? null : await getSupabaseForData()
  const profile = await getCurrentProfile()
  if (!["employee", "manager", "admin"].includes(profile.role)) {
    throw new Error("Недостаточно прав для создания заявки")
  }
  const payload = createPaymentRequestSchema.parse(input)
  assertMandatoryFields(payload)
  const financeGroupName = session.source === "mock"
    ? await findMockFinanceGroupName(payload.finance_group_id)
    : await findFinanceGroupName(db!, payload.finance_group_id)

  const requestPayload = {
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
  }

  if (session.source === "mock") await insertMockRequest(requestPayload)
  else await insertRequest(db!, requestPayload)
}

export async function duplicateOwnRequest(id: string): Promise<void> {
  const session = await getCurrentSession()
  if (session.source !== "mock") assertSupabaseWritesAllowed("Копирование заявки")
  const db = session.source === "mock" ? null : await getSupabaseForData()
  const profile = await getCurrentProfile()
  const existing = session.source === "mock"
    ? await fetchMockRequestById(id)
    : await fetchRequestById(db!, id)

  if (!existing) throw new Error("Заявка не найдена")
  if (existing.applicant_id !== profile.id) throw new Error("Недостаточно прав")

  const financeGroupName = session.source === "mock"
    ? await findMockFinanceGroupName(existing.finance_group_id)
    : await findFinanceGroupName(db!, existing.finance_group_id)
  const purpose = existing.payment_purpose.trim()

  const requestPayload = {
    applicant_id: profile.id,
    applicant_name: profile.full_name,
    applicant_email: profile.email,
    request_date: new Date().toISOString().slice(0, 10),
    amount_rub: existing.amount_rub,
    payment_recipient: existing.payment_recipient,
    payment_purpose: `Копия ${purpose}`,
    desired_payment_date: existing.desired_payment_date,
    critical_payment_date: existing.critical_payment_date,
    finance_group_id: existing.finance_group_id,
    finance_group_name: financeGroupName ?? existing.finance_group_name ?? null,
    planned_payment_date: null,
    paid_amount_rub: null,
    is_paid: false,
    paid_at: null,
    status: "in_progress",
  }

  if (session.source === "mock") await insertMockRequest(requestPayload)
  else await insertRequest(db!, requestPayload)
}

export async function updateOwnRequest(id: string, input: unknown): Promise<void> {
  const session = await getCurrentSession()
  if (session.source !== "mock") assertSupabaseWritesAllowed("Обновление заявки")
  const db = session.source === "mock" ? null : await getSupabaseForData()
  const profile = await getCurrentProfile()
  const payload = updatePaymentRequestSchema.parse({
    ...(typeof input === "object" && input !== null ? input : {}),
    id,
  })
  const existing = session.source === "mock"
    ? await fetchMockRequestById(id)
    : await fetchRequestById(db!, id)

  if (!existing) throw new Error("Заявка не найдена")
  if (existing.applicant_id !== profile.id) throw new Error("Недостаточно прав")
  if (existing.is_paid || existing.status === "partially_paid") {
    throw new Error("Заявки с оплатой нельзя редактировать")
  }

  const merged = {
    amount_rub: payload.amount_rub ?? existing.amount_rub,
    payment_recipient: payload.payment_recipient ?? existing.payment_recipient,
    payment_purpose: payload.payment_purpose ?? existing.payment_purpose,
    desired_payment_date: payload.desired_payment_date ?? existing.desired_payment_date,
    critical_payment_date: payload.critical_payment_date ?? existing.critical_payment_date,
  }
  assertMandatoryFields(merged)

  const financeGroupId = payload.finance_group_id ?? existing.finance_group_id
  const financeGroupName = session.source === "mock"
    ? await findMockFinanceGroupName(financeGroupId)
    : await findFinanceGroupName(db!, financeGroupId)

  const requestPayload = {
    amount_rub: merged.amount_rub,
    payment_recipient: merged.payment_recipient,
    payment_purpose: merged.payment_purpose,
    desired_payment_date: merged.desired_payment_date,
    critical_payment_date: merged.critical_payment_date,
    finance_group_id: financeGroupId,
    finance_group_name: financeGroupName ?? payload.finance_group_name ?? null,
  }

  if (session.source === "mock") await updateOwnMockRequestById(id, profile.id, requestPayload)
  else await updateOwnRequestById(db!, id, profile.id, requestPayload)
}

export async function updateManagerFields(id: string, input: unknown): Promise<void> {
  const session = await getCurrentSession()
  if (session.source !== "mock") assertSupabaseWritesAllowed("Обновление заявки руководителем")
  if (session.role !== "manager" && session.role !== "admin") throw new Error("Недостаточно прав")

  const db = session.source === "mock" ? null : await getSupabaseForData()
  const existing = session.source === "mock"
    ? await fetchMockRequestById(id)
    : await fetchRequestById(db!, id)
  if (!existing) throw new Error("Заявка не найдена")

  const payload = managerUpdatePaymentRequestSchema.parse({
    ...(typeof input === "object" && input !== null ? input : {}),
    id,
  })
  const financeGroupId = payload.finance_group_id ?? existing.finance_group_id
  const financeGroupName = session.source === "mock"
    ? await findMockFinanceGroupName(financeGroupId)
    : await findFinanceGroupName(db!, financeGroupId)

  const requestPayload = {
    planned_payment_date: payload.planned_payment_date ?? existing.planned_payment_date,
    finance_group_id: financeGroupId,
    finance_group_name: financeGroupName ?? payload.finance_group_name ?? existing.finance_group_name ?? null,
  }

  if (session.source === "mock") await updateMockRequestById(id, requestPayload)
  else await updateRequestById(db!, id, requestPayload)
}

export async function addPaymentToRequest(id: string, input: unknown): Promise<void> {
  const session = await getCurrentSession()
  if (session.source !== "mock") assertSupabaseWritesAllowed("Добавление оплаты")
  if (session.role !== "manager" && session.role !== "admin") throw new Error("Недостаточно прав")

  const payload = addPaymentRequestPaymentSchema.parse({
    ...(typeof input === "object" && input !== null ? input : {}),
    id,
  })

  const db = session.source === "mock" ? null : await getSupabaseForData()
  const existing = session.source === "mock"
    ? await fetchMockRequestById(id)
    : (await attachSupabasePayments(db!, [await fetchRequestById(db!, id)].filter(Boolean) as PaymentRequest[]))[0]
  if (!existing) throw new Error("Заявка не найдена")
  if (existing.status === "rejected") throw new Error("Отклонённую заявку нельзя оплатить.")

  const remaining = Math.max(0, Number(existing.amount_rub ?? 0) - getPaidAmountRub(existing))
  if (payload.amount_rub > remaining) throw new Error("Сумма оплаты больше остатка к оплате.")

  const paymentPayload = {
    request_id: id,
    paid_at: payload.paid_at,
    amount_rub: payload.amount_rub,
    note: payload.note ?? null,
    created_by: session.user?.id ?? null,
  }

  if (session.source === "mock") await insertMockPayment(paymentPayload)
  else await insertPayment(db!, paymentPayload)

  const nextPaid = getPaidAmountRub(existing) + payload.amount_rub
  const nextStatus = nextPaid >= Number(existing.amount_rub ?? 0) ? "paid" : "partially_paid"
  const requestPayload = {
    paid_at: payload.paid_at,
    paid_amount_rub: nextPaid,
    is_paid: nextStatus === "paid",
    status: nextStatus,
  }
  if (session.source === "mock") await updateMockRequestById(id, requestPayload)
  else await updateRequestById(db!, id, requestPayload)
}

export async function cancelPaymentInRequest(id: string, paymentId: string): Promise<void> {
  const session = await getCurrentSession()
  if (session.source !== "mock") assertSupabaseWritesAllowed("Отмена оплаты")
  if (session.role !== "manager" && session.role !== "admin") throw new Error("Недостаточно прав")

  const db = session.source === "mock" ? null : await getSupabaseForData()
  const existing = session.source === "mock"
    ? await fetchMockRequestById(id)
    : (await attachSupabasePayments(db!, [await fetchRequestById(db!, id)].filter(Boolean) as PaymentRequest[]))[0]
  if (!existing) throw new Error("Заявка не найдена")

  const payment = (existing.payments ?? []).find((item) => item.id === paymentId)
  if (!payment) throw new Error("Оплата не найдена")

  if (session.source === "mock") {
    await cancelMockPaymentById(id, paymentId, session.user?.id ?? null)
  } else {
    await cancelPaymentById(db!, id, paymentId, session.user?.id ?? null)
  }

  const nextPaid = Math.max(0, getPaidAmountRub(existing) - Number(payment.amount_rub ?? 0))
  const nextStatus = nextPaid <= 0
    ? "in_progress"
    : nextPaid >= Number(existing.amount_rub ?? 0)
      ? "paid"
      : "partially_paid"
  const remainingPayments = (existing.payments ?? []).filter((item) => item.id !== paymentId)
  const lastPayment = remainingPayments.at(-1)
  const requestPayload = {
    paid_at: lastPayment?.paid_at ?? (nextPaid > 0 ? existing.paid_at : null),
    paid_amount_rub: nextPaid > 0 ? nextPaid : null,
    is_paid: nextStatus === "paid",
    status: nextStatus,
  }

  if (session.source === "mock") await updateMockRequestById(id, requestPayload)
  else await updateRequestById(db!, id, requestPayload)
}

export async function softDeleteRequest(id: string): Promise<void> {
  const session = await getCurrentSession()
  if (session.source !== "mock") assertSupabaseWritesAllowed("Скрытие заявки")
  if (session.role !== "admin") throw new Error("Недостаточно прав")

  const db = session.source === "mock" ? null : await getSupabaseForData()
  const existing = session.source === "mock"
    ? await fetchMockRequestById(id)
    : await fetchRequestById(db!, id)
  if (!existing) throw new Error("Заявка не найдена")

  if (session.source === "mock") await softDeleteMockRequestById(id)
  else await softDeleteRequestById(db!, id)
}
