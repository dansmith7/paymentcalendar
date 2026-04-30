import type { SupabaseClient } from "@supabase/supabase-js"
import { assertSupabaseWritesAllowed } from "@/lib/dev-write-guard"
import type { FinanceGroup, PaymentRequest, PaymentRequestPayment } from "@/lib/types"

export type MyRequestsFilters = {
  search?: string
  isPaid?: "all" | "paid" | "unpaid"
  financeGroupId?: string
  weekKey?: string
  sort?: "request_date_asc" | "request_date_desc"
}

export type ManagerRequestsFilters = {
  search?: string
  isPaid?: "all" | "paid" | "unpaid"
  financeGroupId?: string
  weekKey?: string
  sort?:
    | "request_date_desc"
    | "request_date_asc"
    | "desired_payment_date_desc"
    | "desired_payment_date_asc"
    | "amount_desc"
    | "amount_asc"
}

export async function fetchFinanceGroups(
  db: SupabaseClient,
): Promise<FinanceGroup[]> {
  const { data, error } = await db
    .from("finance_groups")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as FinanceGroup[]
}

export async function insertRequest(
  db: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<void> {
  assertSupabaseWritesAllowed("Создание заявки")
  const { error } = await db.from("payment_requests").insert(payload)
  if (error) throw new Error(error.message)
}

export async function fetchPaymentsForRequests(
  db: SupabaseClient,
  requestIds: string[],
): Promise<PaymentRequestPayment[]> {
  if (!requestIds.length) return []
  const { data, error } = await db
    .from("payment_request_payments")
    .select("*")
    .in("request_id", requestIds)
    .is("canceled_at", null)
    .order("paid_at", { ascending: true })
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PaymentRequestPayment[]
}

export async function insertPayment(
  db: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<void> {
  assertSupabaseWritesAllowed("Добавление оплаты")
  const { error } = await db.from("payment_request_payments").insert(payload)
  if (error) throw new Error(error.message)
}

export async function cancelPaymentById(
  db: SupabaseClient,
  requestId: string,
  paymentId: string,
  canceledBy: string | null,
): Promise<void> {
  assertSupabaseWritesAllowed("Отмена оплаты")
  const { error } = await db
    .from("payment_request_payments")
    .update({
      canceled_at: new Date().toISOString(),
      canceled_by: canceledBy,
    })
    .eq("id", paymentId)
    .eq("request_id", requestId)
    .is("canceled_at", null)
  if (error) throw new Error(error.message)
}

export async function fetchMyRequests(
  db: SupabaseClient,
  applicantId: string,
  filters: MyRequestsFilters,
): Promise<PaymentRequest[]> {
  let query = db
    .from("payment_requests")
    .select("*")
    .eq("applicant_id", applicantId)
    .is("deleted_at", null)

  if (filters.search?.trim()) {
    const q = filters.search.trim()
    query = query.or(`payment_purpose.ilike.%${q}%,payment_recipient.ilike.%${q}%`)
  }
  if (filters.isPaid === "paid") query = query.eq("is_paid", true)
  if (filters.isPaid === "unpaid") query = query.eq("is_paid", false)
  if (filters.financeGroupId) query = query.eq("finance_group_id", filters.financeGroupId)
  query = query.order("request_date", {
    ascending: filters.sort === "request_date_asc",
  })

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as PaymentRequest[]
}

export async function fetchRequestById(
  db: SupabaseClient,
  id: string,
): Promise<PaymentRequest | null> {
  const { data, error } = await db
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as PaymentRequest | null) ?? null
}

export async function fetchAllRequests(
  db: SupabaseClient,
  filters: ManagerRequestsFilters,
): Promise<PaymentRequest[]> {
  let query = db.from("payment_requests").select("*").is("deleted_at", null)

  if (filters.search?.trim()) {
    const q = filters.search.trim()
    query = query.or(
      `payment_purpose.ilike.%${q}%,payment_recipient.ilike.%${q}%,applicant_name.ilike.%${q}%`,
    )
  }

  if (filters.isPaid === "paid") query = query.eq("is_paid", true)
  if (filters.isPaid === "unpaid") query = query.eq("is_paid", false)
  if (filters.financeGroupId) query = query.eq("finance_group_id", filters.financeGroupId)

  if (filters.sort === "request_date_asc") query = query.order("request_date", { ascending: true })
  if (filters.sort === "desired_payment_date_desc")
    query = query.order("desired_payment_date", { ascending: false })
  if (filters.sort === "desired_payment_date_asc")
    query = query.order("desired_payment_date", { ascending: true })
  if (filters.sort === "amount_desc") query = query.order("amount_rub", { ascending: false })
  if (filters.sort === "amount_asc") query = query.order("amount_rub", { ascending: true })
  if (!filters.sort || filters.sort === "request_date_desc")
    query = query.order("request_date", { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as PaymentRequest[]
}

export async function updateRequestById(
  db: SupabaseClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  assertSupabaseWritesAllowed("Обновление заявки")
  const { error } = await db.from("payment_requests").update(payload).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function updateOwnRequestById(
  db: SupabaseClient,
  id: string,
  applicantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  assertSupabaseWritesAllowed("Обновление заявки")
  const { error } = await db
    .from("payment_requests")
    .update(payload)
    .eq("id", id)
    .eq("applicant_id", applicantId)

  if (error) throw new Error(error.message)
}

export async function softDeleteRequestById(
  db: SupabaseClient,
  id: string,
): Promise<void> {
  assertSupabaseWritesAllowed("Скрытие заявки")
  const { error } = await db
    .from("payment_requests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) throw new Error(error.message)
}

export async function findFinanceGroupName(
  db: SupabaseClient,
  financeGroupId: string | null,
): Promise<string | null> {
  if (!financeGroupId) return null

  const { data, error } = await db
    .from("finance_groups")
    .select("name")
    .eq("id", financeGroupId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.name ?? null
}

export async function findProfileByEmail(
  db: SupabaseClient,
  email: string,
): Promise<{ id: string; email: string; full_name: string; role: string; created_at: string } | null> {
  const { data, error } = await db
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("email", email)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function findProfileByRole(
  db: SupabaseClient,
  role: string,
): Promise<{ id: string; email: string; full_name: string; role: string; created_at: string } | null> {
  const { data, error } = await db
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("role", role)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function findAnyProfile(
  db: SupabaseClient,
): Promise<{ id: string; email: string; full_name: string; role: string; created_at: string } | null> {
  const { data, error } = await db
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function insertProfile(
  db: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<void> {
  assertSupabaseWritesAllowed("Создание профиля")
  const { error } = await db.from("profiles").insert(payload)
  if (error) throw new Error(error.message)
}
