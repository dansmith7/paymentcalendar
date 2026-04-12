import type { AuthProvider, AppSession } from "@/lib/auth/provider"
import {
  getDevRoleCookieName as getMockRoleCookieName,
  MockAuthProvider,
} from "@/lib/auth/providers/mock-provider"
import { SupabaseAuthProvider } from "@/lib/auth/providers/supabase-provider"

export async function getCurrentSession(): Promise<AppSession> {
  const provider = resolveAuthProvider()
  return provider.getSession()
}

export function getDevRoleCookieName(): string {
  return getMockRoleCookieName()
}

function resolveAuthProvider(): AuthProvider {
  // AUTH_MODE is the main switch-point for enabling magic link auth.
  const mode = process.env.AUTH_MODE
  if (mode === "supabase") return new SupabaseAuthProvider()
  return new MockAuthProvider()
}

