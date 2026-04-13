"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { managerUpdatePaymentRequest } from "@/lib/data/payment-requests"

function toNullableString(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim()
  return str ? str : null
}

export async function managerUpdatePaymentRequestAction(id: string, formData: FormData) {
  const status = String(formData.get("status") ?? "in_progress")
  const payload = {
    status,
    paid_at: toNullableString(formData.get("paid_at")),
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

