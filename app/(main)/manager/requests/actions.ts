"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import {
  addPaymentToPaymentRequest,
  cancelPaymentRequestPayment,
  managerUpdatePaymentRequest,
  softDeletePaymentRequest,
} from "@/lib/data/payment-requests"

function toNullableString(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim()
  return str ? str : null
}

function toNullableAmount(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .trim()
  if (!str) return null
  const amount = Number(str)
  return Number.isFinite(amount) ? amount : Number.NaN
}

function toRequiredAmount(value: FormDataEntryValue | null): number {
  const amount = toNullableAmount(value)
  return amount == null ? Number.NaN : amount
}

export async function managerUpdatePaymentRequestAction(id: string, formData: FormData) {
  const payload = {
    planned_payment_date: toNullableString(formData.get("planned_payment_date")),
    finance_group_id: toNullableString(formData.get("finance_group_id")),
  }

  try {
    await managerUpdatePaymentRequest(id, payload)
  } catch (err) {
    if (err instanceof ZodError) {
      const msg = err.issues[0]?.message
      throw new Error(msg ?? "Проверьте введённые данные")
    }
    throw err
  }
  revalidatePath("/manager/requests")
}

export async function addPaymentToPaymentRequestAction(id: string, formData: FormData) {
  try {
    await addPaymentToPaymentRequest(id, {
      paid_at: toNullableString(formData.get("paid_at")),
      amount_rub: toRequiredAmount(formData.get("amount_rub")),
      note: toNullableString(formData.get("note")),
    })
  } catch (err) {
    if (err instanceof ZodError) {
      const msg = err.issues[0]?.message
      throw new Error(msg ?? "Проверьте введённые данные")
    }
    throw err
  }
  revalidatePath("/manager/requests")
  revalidatePath("/manager/analytics")
  revalidatePath("/employee/requests")
}

export async function cancelPaymentRequestPaymentAction(id: string, paymentId: string) {
  await cancelPaymentRequestPayment(id, paymentId)
  revalidatePath("/manager/requests")
  revalidatePath("/manager/analytics")
  revalidatePath("/employee/requests")
}

export async function adminSoftDeletePaymentRequestAction(id: string) {
  await softDeletePaymentRequest(id)
  revalidatePath("/manager/requests")
  revalidatePath("/manager/analytics")
  revalidatePath("/employee/requests")
}
