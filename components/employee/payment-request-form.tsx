"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  createPaymentRequestFields,
  createPaymentRequestSchema,
  type CreatePaymentRequestDto,
} from "@/lib/schemas/payment-request"
import { formatRubAmountInput, parseRubAmountInput } from "@/lib/helpers/amount-input"
import { FINANCE_GROUP_FIELD_LABEL } from "@/lib/ui-labels"
import type { FinanceGroup, PaymentRequest } from "@/lib/types"
import type { z } from "zod"

type PaymentFormInput = z.input<typeof createPaymentRequestFields>

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const maybeDigest = (error as { digest?: unknown }).digest
  return typeof maybeDigest === "string" && maybeDigest.startsWith("NEXT_REDIRECT")
}

type PaymentRequestFormProps = {
  mode: "create" | "edit"
  financeGroups: FinanceGroup[]
  initialValues?: Partial<PaymentRequest>
  readOnly?: boolean
  onSubmitAction: (formData: FormData) => void | Promise<void>
}

export function PaymentRequestForm({
  mode,
  financeGroups,
  initialValues,
  readOnly = false,
  onSubmitAction,
}: PaymentRequestFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo<PaymentFormInput>(
    () => ({
      amount_rub:
        initialValues?.amount_rub != null &&
        Number.isFinite(Number(initialValues.amount_rub)) &&
        Number(initialValues.amount_rub) > 0
          ? Number(initialValues.amount_rub)
          : undefined,
      payment_recipient: initialValues?.payment_recipient ?? "",
      payment_purpose: initialValues?.payment_purpose ?? "",
      desired_payment_date:
        initialValues?.desired_payment_date ?? new Date().toISOString().slice(0, 10),
      critical_payment_date: initialValues?.critical_payment_date ?? "",
      finance_group_id: initialValues?.finance_group_id ?? "",
      finance_group_name: initialValues?.finance_group_name ?? "",
    }),
    [initialValues],
  )

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(createPaymentRequestSchema),
    defaultValues,
  })

  function buildFormData(data: CreatePaymentRequestDto) {
    const fd = new FormData()
    fd.set("amount_rub", String(data.amount_rub))
    fd.set("payment_recipient", data.payment_recipient)
    fd.set("payment_purpose", data.payment_purpose)
    fd.set("desired_payment_date", data.desired_payment_date)
    fd.set("critical_payment_date", data.critical_payment_date)
    fd.set("finance_group_id", data.finance_group_id ?? "")
    fd.set("finance_group_name", data.finance_group_name ?? "")
    return fd
  }

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSubmitError(null)
        setIsSubmitting(true)
        try {
          await onSubmitAction(buildFormData(data as CreatePaymentRequestDto))
        } catch (error) {
          if (isNextRedirectError(error)) {
            // Next.js uses an internal redirect error to perform navigation after server actions.
            throw error
          }
          const message = error instanceof Error ? error.message : "Не удалось сохранить заявку"
          setSubmitError(message)
        } finally {
          setIsSubmitting(false)
        }
      })}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Сумма"
          hint="Введите сумму к оплате."
          error={errors.amount_rub?.message}
        >
          <Controller
            name="amount_rub"
            control={control}
            render={({ field }) => (
              <AmountRubInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={readOnly}
              />
            )}
          />
        </Field>

        <Field label="Получатель платежа" error={errors.payment_recipient?.message}>
          <input
            {...register("payment_recipient")}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm disabled:bg-muted dark:disabled:bg-muted/50"
          />
        </Field>
      </div>

      <Field label="Назначение платежа" error={errors.payment_purpose?.message}>
        <textarea
          {...register("payment_purpose")}
          disabled={readOnly}
          className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm disabled:bg-muted dark:disabled:bg-muted/50"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Желаемая дата оплаты" error={errors.desired_payment_date?.message}>
          <input
            type="date"
            {...register("desired_payment_date")}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm disabled:bg-muted dark:disabled:bg-muted/50"
          />
        </Field>

        <Field label="Критичная дата оплаты" error={errors.critical_payment_date?.message as string | undefined}>
          <input
            type="date"
            {...register("critical_payment_date")}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm disabled:bg-muted dark:disabled:bg-muted/50"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={FINANCE_GROUP_FIELD_LABEL} error={errors.finance_group_id?.message as string | undefined}>
          <select
            {...register("finance_group_id")}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm disabled:bg-muted dark:disabled:bg-muted/50"
          >
            <option value="">Не выбрано</option>
            {financeGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Название группы (резерв)" error={errors.finance_group_name?.message as string | undefined}>
          <input
            {...register("finance_group_name")}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] shadow-sm disabled:bg-muted dark:disabled:bg-muted/50"
          />
        </Field>
      </div>

      {submitError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {submitError}
        </div>
      ) : null}

      {!readOnly ? (
        <Button type="submit" className="px-4 py-2" disabled={isSubmitting}>
          {isSubmitting ? "Создание..." : mode === "create" ? "Создать заявку" : "Сохранить изменения"}
        </Button>
      ) : (
        <div className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-[0.9375rem] text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
          Заявка оплачена, редактирование недоступно.
        </div>
      )}
    </form>
  )
}

function AmountRubInput({
  value,
  onChange,
  onBlur,
  disabled,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  onBlur: () => void
  disabled?: boolean
}) {
  const [text, setText] = useState(() => formatRubAmountInput(value))

  useEffect(() => {
    setText(formatRubAmountInput(value))
  }, [value])

  return (
    <div className="flex w-full items-center gap-2">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = parseRubAmountInput(text)
          if (!Number.isFinite(n) || n <= 0) {
            setText("")
            onChange(undefined)
          } else {
            onChange(n)
            setText(formatRubAmountInput(n))
          }
          onBlur()
        }}
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-[0.9375rem] tabular-nums shadow-sm disabled:bg-muted dark:disabled:bg-muted/50"
        placeholder="Например: 1 250 000"
      />
      <span className="shrink-0 text-[0.9375rem] font-semibold text-muted-foreground">₽</span>
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[0.9375rem] font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  )
}
