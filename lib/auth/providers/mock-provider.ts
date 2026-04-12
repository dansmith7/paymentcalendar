import { cookies } from "next/headers"
import { getMockProfileByRole } from "@/lib/auth/mock-profiles"
import type { AuthProvider, AppSession } from "@/lib/auth/provider"
import type { UserRole } from "@/lib/types"

const DEV_ROLE_COOKIE = "dev_role"

function toUserRole(value: string | undefined): UserRole {
  if (value === "manager") return "manager"
  if (value === "admin") return "admin"
  return "employee"
}

export class MockAuthProvider implements AuthProvider {
  async getSession(): Promise<AppSession> {
    const cookieStore = await cookies()
    const role = toUserRole(cookieStore.get(DEV_ROLE_COOKIE)?.value)
    const user = getMockProfileByRole(role)

    return {
      user,
      role,
      source: "mock",
    }
  }
}

export function getDevRoleCookieName(): string {
  return DEV_ROLE_COOKIE
}

