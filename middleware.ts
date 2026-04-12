import type { NextRequest } from "next/server"
import { authMiddleware } from "@/lib/auth/middleware"
import { updateSupabaseSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSupabaseSession(request)
  authMiddleware(request)
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Обновление auth-кук Supabase на всех страницах (в т.ч. `/` после magic link).
     * Исключаем статику и картинки.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

