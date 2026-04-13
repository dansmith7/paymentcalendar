import { redirect } from "next/navigation"
import { AuthProvider } from "@/components/auth-provider"
import { AppShell } from "@/components/app-shell"
import { getCurrentSession } from "@/lib/auth/session"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionPromise = getCurrentSession()

  return (
    <AuthSessionBoundary sessionPromise={sessionPromise}>
      {children}
    </AuthSessionBoundary>
  )
}

async function AuthSessionBoundary({
  sessionPromise,
  children,
}: {
  sessionPromise: ReturnType<typeof getCurrentSession>
  children: React.ReactNode
}) {
  const session = await sessionPromise

  // In real auth mode, unauthenticated users should always see the login screen.
  if (process.env.AUTH_MODE === "supabase" && !session.user) {
    redirect("/login")
  }

  return (
    <AuthProvider
      initialUser={session.user}
      initialRole={session.role}
      source={session.source}
    >
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
