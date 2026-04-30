import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { MOCK_PROFILES_BY_ROLE } from "@/lib/auth/mock-profiles"
import type { FinanceGroup, PaymentRequest, PaymentRequestPayment } from "@/lib/types"
import type { ManagerRequestsFilters, MyRequestsFilters } from "@/lib/repositories/requests-repository"

type MockStore = {
  financeGroups: FinanceGroup[]
  requests: PaymentRequest[]
  payments: PaymentRequestPayment[]
}

const STORE_PATH = join(process.cwd(), ".dev-data", "mock-payment-store.json")

const FINANCE_GROUPS: FinanceGroup[] = [
  createGroup("11111111-aaaa-4000-8000-000000000001", "Производство", 10),
  createGroup("11111111-aaaa-4000-8000-000000000002", "Реестр", 20),
  createGroup("11111111-aaaa-4000-8000-000000000003", "Офис", 30),
  createGroup("11111111-aaaa-4000-8000-000000000004", "Маркетинг", 40),
]

function createGroup(id: string, name: string, sortOrder: number): FinanceGroup {
  return {
    id,
    name,
    is_active: true,
    sort_order: sortOrder,
    created_at: "2026-04-01T00:00:00.000Z",
  }
}

function seedRequest(input: Partial<PaymentRequest> & Pick<PaymentRequest, "amount_rub" | "payment_recipient" | "payment_purpose" | "desired_payment_date" | "critical_payment_date" | "finance_group_id">): PaymentRequest {
  const group = FINANCE_GROUPS.find((item) => item.id === input.finance_group_id)
  const applicant = input.applicant_id === MOCK_PROFILES_BY_ROLE.manager.id
    ? MOCK_PROFILES_BY_ROLE.manager
    : MOCK_PROFILES_BY_ROLE.employee

  return {
    id: input.id ?? randomUUID(),
    applicant_id: applicant.id,
    applicant_name: input.applicant_name ?? applicant.full_name,
    applicant_email: input.applicant_email ?? applicant.email,
    request_date: input.request_date ?? "2026-04-24",
    amount_rub: input.amount_rub,
    payment_recipient: input.payment_recipient,
    payment_purpose: input.payment_purpose,
    desired_payment_date: input.desired_payment_date,
    critical_payment_date: input.critical_payment_date,
    finance_group_id: input.finance_group_id,
    finance_group_name: group?.name ?? null,
    planned_payment_date: input.planned_payment_date ?? null,
    paid_amount_rub: input.paid_amount_rub ?? null,
    is_paid: input.is_paid ?? false,
    paid_at: input.paid_at ?? null,
    status: input.status ?? "in_progress",
    sync_status: null,
    external_id: null,
    last_synced_at: null,
    created_at: input.created_at ?? "2026-04-24T10:00:00.000Z",
    updated_at: input.updated_at ?? "2026-04-24T10:00:00.000Z",
    deleted_at: input.deleted_at ?? null,
  }
}

function createInitialStore(): MockStore {
  return {
    financeGroups: FINANCE_GROUPS,
    payments: [],
    requests: [
      seedRequest({
        id: "aaaaaaaa-1111-4000-8000-000000000001",
        amount_rub: 3280000,
        payment_recipient: "Элпитех",
        payment_purpose: "плата модуля вайфай 2000 шт. под будущие SR",
        desired_payment_date: "2026-04-24",
        critical_payment_date: "2026-04-30",
        finance_group_id: FINANCE_GROUPS[0].id,
      }),
      seedRequest({
        id: "aaaaaaaa-1111-4000-8000-000000000002",
        amount_rub: 5369000,
        payment_recipient: "Элпитех",
        payment_purpose: "реестровые компоненты под сборку новой партии RT",
        desired_payment_date: "2026-04-27",
        critical_payment_date: "2026-04-30",
        finance_group_id: FINANCE_GROUPS[0].id,
      }),
      seedRequest({
        id: "aaaaaaaa-1111-4000-8000-000000000003",
        amount_rub: 1700000,
        payment_recipient: "Ренне Групп",
        payment_purpose: "поставка комплектующих",
        desired_payment_date: "2026-04-30",
        critical_payment_date: "2026-05-11",
        finance_group_id: FINANCE_GROUPS[1].id,
      }),
      seedRequest({
        id: "aaaaaaaa-1111-4000-8000-000000000004",
        amount_rub: 700000,
        payment_recipient: "Аренда офиса",
        payment_purpose: "аренда офиса за май",
        desired_payment_date: "2026-04-30",
        critical_payment_date: "2026-05-05",
        finance_group_id: FINANCE_GROUPS[2].id,
      }),
      seedRequest({
        id: "aaaaaaaa-1111-4000-8000-000000000005",
        amount_rub: 508000,
        payment_recipient: "Спинтроника",
        payment_purpose: "оплата по счету за материалы",
        desired_payment_date: "2026-04-24",
        critical_payment_date: "2026-04-30",
        finance_group_id: FINANCE_GROUPS[1].id,
        applicant_id: MOCK_PROFILES_BY_ROLE.manager.id,
      }),
    ],
  }
}

async function readStore(): Promise<MockStore> {
  try {
    const store = JSON.parse(await readFile(STORE_PATH, "utf8")) as MockStore
    store.payments ??= []
    return store
  } catch {
    const store = createInitialStore()
    await writeStore(store)
    return store
  }
}

async function writeStore(store: MockStore): Promise<void> {
  await mkdir(dirname(STORE_PATH), { recursive: true })
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`)
}

function activeRequests(rows: PaymentRequest[]): PaymentRequest[] {
  return rows.filter((row) => !row.deleted_at)
}

function attachPayments(row: PaymentRequest, payments: PaymentRequestPayment[]): PaymentRequest {
  return {
    ...row,
    payments: payments
      .filter((payment) => payment.request_id === row.id && !payment.canceled_at)
      .sort((a, b) => a.paid_at.localeCompare(b.paid_at) || a.created_at.localeCompare(b.created_at)),
  }
}

function applySearch(rows: PaymentRequest[], search?: string): PaymentRequest[] {
  const q = search?.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    [row.applicant_name, row.payment_recipient, row.payment_purpose].join(" ").toLowerCase().includes(q),
  )
}

function applyCommonFilters<T extends MyRequestsFilters | ManagerRequestsFilters>(
  rows: PaymentRequest[],
  filters: T,
): PaymentRequest[] {
  let result = applySearch(rows, filters.search)
  if (filters.isPaid === "paid") result = result.filter((row) => row.is_paid)
  if (filters.isPaid === "unpaid") result = result.filter((row) => !row.is_paid)
  if (filters.financeGroupId) result = result.filter((row) => row.finance_group_id === filters.financeGroupId)
  return result
}

export async function fetchMockFinanceGroups(): Promise<FinanceGroup[]> {
  const store = await readStore()
  return [...store.financeGroups].sort((a, b) => a.sort_order - b.sort_order)
}

export async function fetchMockMyRequests(applicantId: string, filters: MyRequestsFilters): Promise<PaymentRequest[]> {
  const store = await readStore()
  const rows = activeRequests(store.requests)
    .filter((row) => row.applicant_id === applicantId)
    .map((row) => attachPayments(row, store.payments))
  return applyCommonFilters(rows, filters).sort((a, b) =>
    filters.sort === "request_date_asc"
      ? a.request_date.localeCompare(b.request_date)
      : b.request_date.localeCompare(a.request_date),
  )
}

export async function fetchMockAllRequests(filters: ManagerRequestsFilters): Promise<PaymentRequest[]> {
  const store = await readStore()
  const rows = applyCommonFilters(
    activeRequests(store.requests).map((row) => attachPayments(row, store.payments)),
    filters,
  )
  return rows.sort((a, b) => {
    if (filters.sort === "request_date_asc") return a.request_date.localeCompare(b.request_date)
    if (filters.sort === "desired_payment_date_desc") return b.desired_payment_date.localeCompare(a.desired_payment_date)
    if (filters.sort === "desired_payment_date_asc") return a.desired_payment_date.localeCompare(b.desired_payment_date)
    if (filters.sort === "amount_desc") return b.amount_rub - a.amount_rub
    if (filters.sort === "amount_asc") return a.amount_rub - b.amount_rub
    return b.request_date.localeCompare(a.request_date)
  })
}

export async function fetchMockRequestById(id: string): Promise<PaymentRequest | null> {
  const store = await readStore()
  const row = activeRequests(store.requests).find((item) => item.id === id)
  return row ? attachPayments(row, store.payments) : null
}

export async function findMockFinanceGroupName(financeGroupId: string | null): Promise<string | null> {
  if (!financeGroupId) return null
  const groups = await fetchMockFinanceGroups()
  return groups.find((group) => group.id === financeGroupId)?.name ?? null
}

export async function insertMockRequest(payload: Record<string, unknown>): Promise<void> {
  const store = await readStore()
  const now = new Date().toISOString()
  const row = payload as Partial<PaymentRequest>
  store.requests.unshift({
    id: randomUUID(),
    applicant_id: row.applicant_id ?? MOCK_PROFILES_BY_ROLE.employee.id,
    applicant_name: row.applicant_name ?? MOCK_PROFILES_BY_ROLE.employee.full_name,
    applicant_email: row.applicant_email ?? MOCK_PROFILES_BY_ROLE.employee.email,
    request_date: row.request_date ?? new Date().toISOString().slice(0, 10),
    amount_rub: Number(row.amount_rub ?? 0),
    payment_recipient: row.payment_recipient ?? "",
    payment_purpose: row.payment_purpose ?? "",
    desired_payment_date: row.desired_payment_date ?? new Date().toISOString().slice(0, 10),
    critical_payment_date: row.critical_payment_date ?? null,
    finance_group_id: row.finance_group_id ?? null,
    finance_group_name: row.finance_group_name ?? null,
    planned_payment_date: row.planned_payment_date ?? null,
    paid_amount_rub: row.paid_amount_rub ?? null,
    is_paid: row.is_paid ?? false,
    paid_at: row.paid_at ?? null,
    status: row.status ?? "in_progress",
    sync_status: row.sync_status ?? null,
    external_id: row.external_id ?? null,
    last_synced_at: row.last_synced_at ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: row.deleted_at ?? null,
  })
  await writeStore(store)
}

async function updateMockRequest(id: string, payload: Record<string, unknown>, applicantId?: string): Promise<void> {
  const store = await readStore()
  const idx = store.requests.findIndex((row) => row.id === id && !row.deleted_at && (!applicantId || row.applicant_id === applicantId))
  if (idx === -1) throw new Error("Заявка не найдена")
  store.requests[idx] = {
    ...store.requests[idx],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  await writeStore(store)
}

export async function updateMockRequestById(id: string, payload: Record<string, unknown>): Promise<void> {
  await updateMockRequest(id, payload)
}

export async function updateOwnMockRequestById(id: string, applicantId: string, payload: Record<string, unknown>): Promise<void> {
  await updateMockRequest(id, payload, applicantId)
}

export async function softDeleteMockRequestById(id: string): Promise<void> {
  await updateMockRequest(id, { deleted_at: new Date().toISOString() })
}

export async function insertMockPayment(payload: Record<string, unknown>): Promise<void> {
  const store = await readStore()
  store.payments.push({
    id: randomUUID(),
    request_id: String(payload.request_id),
    paid_at: String(payload.paid_at),
    amount_rub: Number(payload.amount_rub),
    note: payload.note ? String(payload.note) : null,
    created_by: payload.created_by ? String(payload.created_by) : null,
    created_at: new Date().toISOString(),
    canceled_at: null,
    canceled_by: null,
  })
  await writeStore(store)
}

export async function cancelMockPaymentById(
  requestId: string,
  paymentId: string,
  canceledBy: string | null,
): Promise<void> {
  const store = await readStore()
  const idx = store.payments.findIndex(
    (payment) => payment.id === paymentId && payment.request_id === requestId && !payment.canceled_at,
  )
  if (idx === -1) throw new Error("Оплата не найдена")
  store.payments[idx] = {
    ...store.payments[idx],
    canceled_at: new Date().toISOString(),
    canceled_by: canceledBy,
  }
  await writeStore(store)
}
