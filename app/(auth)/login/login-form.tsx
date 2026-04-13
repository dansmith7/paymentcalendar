"use client"

import { useActionState } from "react"
import Link from "next/link"
import { sendMagicLink, type MagicLinkState } from "@/lib/auth/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LoginFormProps = {
  nextPath: string
  authMode: string
}

export function LoginForm({ nextPath, authMode }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<MagicLinkState, FormData>(sendMagicLink, null)

  if (authMode !== "supabase") {
    return (
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-muted/30 p-6 text-left text-[0.9375rem] leading-relaxed text-muted-foreground">
        <p>
          Сейчас включён <span className="font-medium text-foreground">AUTH_MODE=mock</span>: вход по email не
          используется. Выберите роль в сайдбаре на главной или переключите в{" "}
          <span className="font-medium text-foreground">AUTH_MODE=supabase</span>.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 w-full items-center justify-center")}
        >
          На главную
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4 text-left">
      <input type="hidden" name="next" value={nextPath} />
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          Рабочий email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.ru"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[0.9375rem] shadow-sm"
        />
      </div>
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{state.error}</p>
      ) : null}
      <Button type="submit" className="h-9 w-full" disabled={pending}>
        {pending ? "Отправляем…" : "Получить ссылку для входа"}
      </Button>
    </form>
  )
}
