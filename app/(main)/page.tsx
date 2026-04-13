import Link from "next/link"
import { getCurrentSession } from "@/lib/auth/session"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/types"

export default async function Home() {
  const session = await getCurrentSession()
  const role = session.role as UserRole | null
  const authMode = process.env.AUTH_MODE ?? "mock"

  return (
    <section>
      <h1>Главная</h1>
      <div className="mt-5 space-y-5 text-base leading-relaxed text-muted-foreground">
        {authMode === "supabase" && !session.user ? (
          <div className="rounded-xl border border-border bg-muted/40 p-6 shadow-sm">
            <p className="text-foreground">
              Войдите по ссылке из письма: укажите рабочий email на странице входа. После первого входа в таблице{" "}
              <code className="rounded bg-muted px-1 text-sm">profiles</code> создаётся запись с ролью{" "}
              <span className="font-medium text-foreground">сотрудник</span>; роль{" "}
              <span className="font-medium text-foreground">руководитель</span> задаётся вручную в Supabase.
            </p>
            <Link href="/login" className={cn(buttonVariants(), "mt-5 inline-flex")}>
              Перейти ко входу
            </Link>
          </div>
        ) : null}

        {authMode === "mock" ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm">
            Локальная разработка: роль <span className="font-medium text-foreground">employee / manager</span>{" "}
            переключается блоком внизу сайдбара (cookie <code className="rounded bg-muted px-1">dev_role</code>).
          </p>
        ) : null}

        {role === "employee" ? (
          <RoleBlock title="Сотрудник">
            <ul className="mt-3 list-inside list-disc space-y-2 text-foreground/90">
              <li>Создавать заявки на оплату: сумма, получатель, назначение, желаемая и критичная даты, группа финансового учёта.</li>
              <li>Смотреть список своих заявок, фильтровать и открывать карточку.</li>
              <li>Редактировать неоплаченную заявку; оплаченные заявки недоступны для правок.</li>
            </ul>
          </RoleBlock>
        ) : null}

        {role === "manager" ? (
          <RoleBlock title="Руководитель">
            <ul className="mt-3 list-inside list-disc space-y-2 text-foreground/90">
              <li>Видеть все заявки компании: поиск, группировка по неделям по желаемой или критичной дате.</li>
              <li>Массово отмечать заявки к оплате по неделям, менять статус, планируемую дату, группу финансового учёта, факт оплаты.</li>
              <li>Смотреть аналитику: сводка по текущей неделе и детализация по неделям.</li>
            </ul>
          </RoleBlock>
        ) : null}

        {role === "admin" ? (
          <RoleBlock title="Администратор">
            <ul className="mt-3 list-inside list-disc space-y-2 text-foreground/90">
              <li>Те же возможности, что у руководителя по заявкам (в текущей версии приложения роль выделена для расширения прав).</li>
              <li>Дальнейшая настройка доступов и справочников — через Supabase и политики проекта.</li>
            </ul>
          </RoleBlock>
        ) : null}
      </div>
    </section>
  )
}

function RoleBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-5 shadow-sm">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
