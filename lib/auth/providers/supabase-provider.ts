import { createClient } from "@/lib/supabase/server"
import type { AuthProvider, AppSession } from "@/lib/auth/provider"
import type { Profile, UserRole } from "@/lib/types"

function toUserRole(value: string | null | undefined): UserRole {
  if (value === "manager") return "manager"
  if (value === "admin") return "admin"
  return "employee"
}

export class SupabaseAuthProvider implements AuthProvider {
  async getSession(): Promise<AppSession> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id || !user.email) {
      return { user: null, role: null, source: "supabase" }
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .eq("id", user.id)
      .maybeSingle()

    const profile: Profile = {
      id: user.id,
      email: user.email,
      full_name:
        profileRow?.full_name ??
        String(user.user_metadata?.full_name ?? user.email.split("@")[0]),
      role: toUserRole(profileRow?.role),
      created_at: profileRow?.created_at ?? new Date().toISOString(),
    }

    return {
      user: profile,
      role: profile.role,
      source: "supabase",
    }
  }
}

