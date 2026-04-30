"use client"

import { useAuthSession } from "@/components/auth-provider"
import type { UserRole } from "@/lib/types"

const DEV_ROLES: UserRole[] = ["employee", "manager", "admin"]

export function DevRoleSwitcher() {
  const { role, isSwitchingRole, switchRole, source } = useAuthSession()

  if (source !== "mock") return null

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
      <p className="text-[0.9375rem] font-semibold tracking-tight">Dev auth mode</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Быстрое переключение роли для локальной разработки.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEV_ROLES.map((devRole) => (
          <button
            key={devRole}
            type="button"
            onClick={() => switchRole(devRole)}
            disabled={isSwitchingRole}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              role === devRole
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-background hover:bg-muted"
            }`}
          >
            {devRole}
          </button>
        ))}
      </div>
    </div>
  )
}
