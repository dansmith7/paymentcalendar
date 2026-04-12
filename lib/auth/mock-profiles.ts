import type { Profile, UserRole } from "@/lib/types"

export const MOCK_PROFILES_BY_ROLE: Record<UserRole, Profile> = {
  employee: {
    id: "11111111-1111-1111-1111-111111111111",
    email: "employee@local.dev",
    full_name: "Employee Demo",
    role: "employee",
    created_at: "2026-04-08T00:00:00.000Z",
  },
  manager: {
    id: "22222222-2222-2222-2222-222222222222",
    email: "manager@local.dev",
    full_name: "Manager Demo",
    role: "manager",
    created_at: "2026-04-08T00:00:00.000Z",
  },
  admin: {
    id: "33333333-3333-3333-3333-333333333333",
    email: "admin@local.dev",
    full_name: "Admin Demo",
    role: "admin",
    created_at: "2026-04-08T00:00:00.000Z",
  },
}

export function getMockProfileByRole(role: UserRole): Profile {
  return MOCK_PROFILES_BY_ROLE[role]
}

