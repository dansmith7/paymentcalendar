"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { DevRoleSwitcher } from "@/components/dev-role-switcher"
import { useAuthSession } from "@/components/auth-provider"

type NavItem = {
  href: string
  label: string
  roles: Array<"employee" | "manager">
}

const NAV_ITEMS: NavItem[] = [
  { href: "/employee/requests", label: "Мои заявки", roles: ["employee"] },
  { href: "/employee/requests/new", label: "Новая заявка", roles: ["employee"] },
  { href: "/manager/requests", label: "Заявки команды", roles: ["manager"] },
  { href: "/manager/analytics", label: "Аналитика", roles: ["manager"] },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role, user } = useAuthSession()

  const navItems = NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role as "employee" | "manager") : false,
  )

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b border-border bg-card/85 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Платежный календарь
            </p>
            <p className="mt-0.5 truncate text-lg font-semibold tracking-tight md:text-xl">
              {user?.full_name ?? "Гость"}
            </p>
          </div>
          <div className="shrink-0 text-right text-sm leading-snug md:text-[0.9375rem]">
            <p className="font-medium text-foreground">Роль: {role ?? "-"}</p>
            <p className="mt-0.5 truncate text-muted-foreground">{user?.email ?? "-"}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 py-5 md:gap-6 md:px-6 md:py-6 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,228px)_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:max-w-[228px] md:justify-self-start">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <DevRoleSwitcher />
        </aside>

        <main className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

