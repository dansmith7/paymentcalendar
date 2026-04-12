import { NextResponse } from "next/server"
import { getDevRoleCookieName } from "@/lib/auth/session"
import type { UserRole } from "@/lib/types"

type RoleBody = {
  role?: UserRole
}

function normalizeRole(role: string | undefined): UserRole {
  if (role === "manager") return "manager"
  if (role === "admin") return "admin"
  return "employee"
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RoleBody
  const role = normalizeRole(body.role)
  const response = NextResponse.json({ ok: true, role })

  response.cookies.set(getDevRoleCookieName(), role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}

