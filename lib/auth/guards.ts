import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/auth/session"
import type { UserRole } from "@/lib/types"

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getCurrentSession()

  if (!session.user || !session.role || !allowedRoles.includes(session.role)) {
    const h = await headers()
    const pathname = h.get("x-pathname") ?? "/"
    const next = encodeURIComponent(pathname)
    redirect(`/login?next=${next}`)
  }

  return session
}

