import { requireRole } from "@/lib/auth/guards"

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["manager"])
  return children
}

