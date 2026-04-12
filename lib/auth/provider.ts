import type { Profile, UserRole } from "@/lib/types"

export type AppSession = {
  user: Profile | null
  role: UserRole | null
  source: "mock" | "supabase"
}

export interface AuthProvider {
  getSession(): Promise<AppSession>
}

