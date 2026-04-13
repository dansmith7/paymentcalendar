import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/auth/session"
import { LoginForm } from "./login-form"

type LoginPageProps = {
  searchParams: Promise<{
    sent?: string
    error?: string
    next?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const authMode = process.env.AUTH_MODE ?? "mock"
  const session = await getCurrentSession()

  if (authMode === "supabase" && session.user) {
    redirect("/")
  }

  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/"

  const sent = params.sent === "1" || params.sent === "true"
  const authError = params.error === "1" || params.error === "true"

  return (
    <div className="flex min-h-full flex-col bg-muted/30">
      <header className="border-b border-border bg-card/90 px-4 py-4 shadow-sm">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Платежный календарь
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Вход</h1>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        {sent ? (
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="space-y-3 text-left">
              <h2 className="text-lg font-semibold tracking-tight">Проверьте почту</h2>
              <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                Если аккаунт с таким email есть, мы отправили одноразовую ссылку для входа. Откройте письмо и
                перейдите по ссылке — после этого вы окажетесь в приложении.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Роль по умолчанию — <span className="font-medium text-foreground">сотрудник</span>. Руководителя
                назначаете вручную в Supabase (таблица <code className="rounded bg-muted px-1">profiles</code>, поле{" "}
                <code className="rounded bg-muted px-1">role</code>).
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t border-border pt-5">
              <Link
                href="/login"
                className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
              >
                Отправить ещё раз
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="space-y-2 text-left">
              <h2 className="text-lg font-semibold tracking-tight">Вход по ссылке</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Укажите email — отправим ссылку для входа без пароля.
              </p>
            </div>
            {authError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm text-red-800">
                Не удалось подтвердить вход. Запросите новую ссылку или проверьте срок действия ссылки.
              </p>
            ) : null}
            <LoginForm nextPath={nextPath} authMode={authMode} />
            <div className="border-t border-border pt-1">
              <Link
                href="/"
                className="inline-flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                На главную
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
