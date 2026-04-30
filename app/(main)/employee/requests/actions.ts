"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createPaymentRequest,
  duplicateMyPaymentRequest,
  updateMyPaymentRequest,
} from "@/lib/data/payment-requests"

function formDataToPayload(formData: FormData) {
  const amountRaw = String(formData.get("amount_rub") ?? "")
    .replace(/\s/g, "")
    .replace(",", ".")

  return {
    amount_rub: Number(amountRaw),
    payment_recipient: String(formData.get("payment_recipient") ?? ""),
    payment_purpose: String(formData.get("payment_purpose") ?? ""),
    desired_payment_date: String(formData.get("desired_payment_date") ?? ""),
    critical_payment_date: String(formData.get("critical_payment_date") ?? ""),
    finance_group_id: String(formData.get("finance_group_id") ?? ""),
    finance_group_name: String(formData.get("finance_group_name") ?? ""),
  }
}

export async function createPaymentRequestAction(formData: FormData) {
  const payload = formDataToPayload(formData)
  await createPaymentRequest(payload)
  revalidatePath("/employee/requests")
  redirect("/employee/requests?submitted=1")
}

export async function updatePaymentRequestAction(id: string, formData: FormData) {
  const payload = formDataToPayload(formData)
  await updateMyPaymentRequest(id, payload)
  revalidatePath("/employee/requests")
  redirect("/employee/requests")
}

export async function duplicatePaymentRequestAction(id: string) {
  await duplicateMyPaymentRequest(id)
  revalidatePath("/employee/requests")
  redirect("/employee/requests?submitted=copy")
}
