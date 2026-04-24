"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type MagicLinkState = { error?: string } | null

function mapAuthEmailError(message: string, code?: string): string {
  const lower = message.toLowerCase()
  if (
    code === "over_email_send_rate_limit" ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return "Слишком много писем за короткое время (лимит Supabase Auth). Подождите несколько минут или используйте AUTH_MODE=mock для разработки без писем."
  }
  return message
}

async function resolveOrigin(): Promise<string> {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "")
  if (fromEnv) return fromEnv

  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "127.0.0.1:3000"
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https")
  return `${proto}://${host}`
}

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  if (process.env.AUTH_MODE !== "supabase") {
    return {
      error:
        "Вход по ссылке доступен при AUTH_MODE=supabase. Для локальной разработки без входа оставьте AUTH_MODE=mock.",
    }
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const fullName = String(formData.get("full_name") ?? "").trim()
  const loginIntent = String(formData.get("login_intent") ?? "existing").trim()

  if (!email) {
    return { error: "Введите email." }
  }

  const isNewUser = loginIntent === "new"
  if (isNewUser && !fullName) {
    return { error: "Введите ФИО." }
  }

  const nextRaw = String(formData.get("next") ?? "/").trim() || "/"
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/"

  const origin = await resolveOrigin()
  const supabase = await createClient()
  if (!isNewUser) {
    // Existing-user flow: check through service role to avoid RLS restrictions for anonymous visitors.
    const admin = createAdminClient()
    const { data: existingProfile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (profileError) {
      return { error: "Не удалось проверить пользователя. Повторите попытку." }
    }
    if (!existingProfile) {
      return {
        error:
          "Пользователь с таким email не найден. Выберите режим «Новый пользователь» для первой регистрации.",
      }
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: isNewUser,
      data: isNewUser
        ? {
            full_name: fullName,
          }
        : undefined,
    },
  })

  if (error) {
    return { error: mapAuthEmailError(error.message, error.code) }
  }

  redirect(`/login?sent=1`)
}
