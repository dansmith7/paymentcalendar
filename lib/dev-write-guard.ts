export function isDevReadOnlyMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_WRITES !== "true"
}

export function assertSupabaseWritesAllowed(action: string): void {
  if (!isDevReadOnlyMode()) return

  throw new Error(
    `${action} отключено в dev read-only режиме. Локальный сервер может читать Supabase, но не записывает данные. Для осознанной записи задайте ALLOW_DEV_WRITES=true.`,
  )
}
