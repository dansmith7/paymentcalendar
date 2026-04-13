import { requireRole } from "@/lib/auth/guards"

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["employee", "admin"])
  return children
}

