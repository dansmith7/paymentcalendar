import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/auth/session"
import type { UserRole } from "@/lib/types"

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getCurrentSession()

  if (!session.role || !allowedRoles.includes(session.role)) {
    redirect("/")
  }

  return session
}

