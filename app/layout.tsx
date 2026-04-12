import type { Metadata } from "next";
import { Geist_Mono, Mulish } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";
import { getCurrentSession } from "@/lib/auth/session";

const mulish = Mulish({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Платежный календарь",
  description: "Заявки на оплату для сотрудников и руководителя: учёт, недели, аналитика",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionPromise = getCurrentSession()

  return (
    <html
      lang="ru"
      className={`${mulish.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {/* Layout is server-rendered; session is resolved before provider hydration. */}
        <AuthSessionBoundary sessionPromise={sessionPromise}>
          {children}
        </AuthSessionBoundary>
      </body>
    </html>
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
