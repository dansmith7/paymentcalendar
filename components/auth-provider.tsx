"use client"

import { createContext, useContext, useMemo, useState } from "react"
import type { Profile, UserRole } from "@/lib/types"

type SessionSource = "mock" | "supabase"

type AuthContextValue = {
  user: Profile | null
  role: UserRole | null
  source: SessionSource
  isSwitchingRole: boolean
  switchRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  initialUser: Profile | null
  initialRole: UserRole | null
  source: SessionSource
  children: React.ReactNode
}

export function AuthProvider({
  initialUser,
  initialRole,
  source,
  children,
}: AuthProviderProps) {
  const [user] = useState<Profile | null>(initialUser)
  const [role, setRole] = useState<UserRole | null>(initialRole)
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)

  async function switchRole(nextRole: UserRole) {
    setIsSwitchingRole(true)
    try {
      const response = await fetch("/api/dev-auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to switch role")
      }

      setRole(nextRole)
      window.location.reload()
    } finally {
      setIsSwitchingRole(false)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      source,
      isSwitchingRole,
      switchRole,
    }),
    [user, role, source, isSwitchingRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthSession(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthSession must be used within AuthProvider")
  }
  return context
}
