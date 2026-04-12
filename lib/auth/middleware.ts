import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function authMiddleware(request: NextRequest) {
  // Placeholder for real Supabase session checks.
  // Future implementation:
  // 1) Read auth cookie/session
  // 2) Resolve current user/profile
  // 3) Enforce route-role mapping before rendering
  // 4) Redirect unauthorized users
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

