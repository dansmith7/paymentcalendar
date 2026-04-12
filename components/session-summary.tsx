"use client"

import { useAuthSession } from "@/components/auth-provider"

export function SessionSummary() {
  const { user, role, source } = useAuthSession()

  return (
    <div className="rounded-xl border p-4 text-sm">
      <p className="font-medium">Current session</p>
      <div className="mt-2 space-y-1 text-zinc-700 dark:text-zinc-300">
        <p>source: {source}</p>
        <p>role: {role ?? "-"}</p>
        <p>profile id: {user?.id ?? "-"}</p>
        <p>email: {user?.email ?? "-"}</p>
        <p>name: {user?.full_name ?? "-"}</p>
      </div>
    </div>
  )
}

