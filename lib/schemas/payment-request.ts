import { z } from "zod"
import { PAYMENT_REQUEST_STATUSES } from "@/lib/types"

const DATE_REQUIRED = "Дата обязательна для заполнения"

function nullToEmptyString(val: unknown): string {
  if (val === null || val === undefined) return ""
  return String(val)
}

/** Обязательное поле даты из `<input type="date">` (пусто или невалидно → одно сообщение). */
const requiredIsoDate = z.string().superRefine((val, ctx) => {
  const t = (val ?? "").trim()
  if (!t) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_REQUIRED })
    return
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_REQUIRED })
    return
  }
  const d = new Date(`${t}T12:00:00`)
  if (Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_REQUIRED })
  }
})

const optionalDateString = z
  .preprocess(nullToEmptyString, z.string())
  .superRefine((val, ctx) => {
    const t = (val ?? "").trim()
    if (!t) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_REQUIRED })
      return
    }
    const d = new Date(`${t}T12:00:00`)
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_REQUIRED })
    }
  })
  .transform((value) => {
    const t = value.trim()
    return t === "" ? null : t
  })

export const createPaymentRequestFields = z.object({
  amount_rub: z.number().optional(),
  payment_recipient: z.preprocess(nullToEmptyString, z.string().trim().min(2, "Укажите получателя")),
  payment_purpose: z.preprocess(nullToEmptyString, z.string().trim().min(2, "Опишите назначение платежа")),
  desired_payment_date: z.preprocess(nullToEmptyString, requiredIsoDate),
  critical_payment_date: z.preprocess(nullToEmptyString, requiredIsoDate),
  finance_group_id: z
    .preprocess(nullToEmptyString, z.union([z.literal(""), z.string().uuid()]))
    .transform((value) => (value === "" ? null : value)),
  finance_group_name: z
    .preprocess(nullToEmptyString, z.string().trim())
    .transform((s) => (s === "" ? null : s))
    .nullable(),
})

export const createPaymentRequestSchema = createPaymentRequestFields
  .superRefine((data, ctx) => {
    const n = data.amount_rub
    if (n === undefined || n === null || !Number.isFinite(n) || n <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Сумма должна быть больше нуля",
        path: ["amount_rub"],
      })
    }
  })
  .transform((data) => ({
    ...data,
    amount_rub: data.amount_rub as number,
  }))

export const updatePaymentRequestSchema = createPaymentRequestFields
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine((data, ctx) => {
    if (data.amount_rub === undefined) return
    if (!Number.isFinite(data.amount_rub) || data.amount_rub <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Сумма должна быть больше нуля",
        path: ["amount_rub"],
      })
    }
  })

export const managerUpdatePaymentRequestSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(PAYMENT_REQUEST_STATUSES).optional(),
    planned_payment_date: optionalDateString.optional(),
    is_paid: z.boolean().optional(),
    paid_at: optionalDateString.optional(),
    finance_group_id: z
      .string()
      .uuid()
      .or(z.literal(""))
      .nullable()
      .optional()
      .transform((value) => (value === "" ? null : value)),
    finance_group_name: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "paid") {
      const raw = data.paid_at
      const ok = typeof raw === "string" && raw.trim().length > 0
      if (!ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Заполните обязательное поле «Дата оплаты факт».",
          path: ["paid_at"],
        })
      }
    }
  })

export type CreatePaymentRequestDto = z.infer<typeof createPaymentRequestSchema>
export type UpdatePaymentRequestDto = z.infer<typeof updatePaymentRequestSchema>
export type ManagerUpdatePaymentRequestDto = z.infer<
  typeof managerUpdatePaymentRequestSchema
>
