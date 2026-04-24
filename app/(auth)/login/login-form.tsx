"use client"

import { useActionState } from "react"
import { useState } from "react"
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
  const [loginIntent, setLoginIntent] = useState<"existing" | "new">("existing")

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
      <input type="hidden" name="login_intent" value={loginIntent} />
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/20 p-1">
        <button
          type="button"
          onClick={() => setLoginIntent("existing")}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            loginIntent === "existing"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Уже зарегистрирован
        </button>
        <button
          type="button"
          onClick={() => setLoginIntent("new")}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            loginIntent === "new"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Новый пользователь
        </button>
      </div>
      {loginIntent === "existing" ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Введите только email. Этот режим не создаёт новых пользователей.
        </p>
      ) : null}
      {loginIntent === "new" ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Для первичной регистрации укажите ФИО и email.
        </p>
      ) : null}
      {loginIntent === "new" ? (
      <div className="flex flex-col gap-2">
        <label htmlFor="full_name" className="text-sm font-semibold text-foreground">
          ФИО
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required={loginIntent === "new"}
          placeholder="Иванов Иван Иванович"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[0.9375rem] shadow-sm"
        />
      </div>
      ) : null}
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
