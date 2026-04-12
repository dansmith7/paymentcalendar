import type { PaymentRequest } from "@/lib/types"

export type SyncResult = {
  ok: boolean
  externalId?: string
  errorMessage?: string
}

export interface SheetsSyncService {
  exportRequest(request: PaymentRequest): Promise<SyncResult>
  importStatusUpdates(): Promise<void>
}

export class NoopSheetsSyncService implements SheetsSyncService {
  async exportRequest(request: PaymentRequest): Promise<SyncResult> {
    // Placeholder integration point: replace with Google Sheets gateway.
    void request
    return { ok: true }
  }

  async importStatusUpdates(): Promise<void> {
    // Placeholder integration point for pull-sync from Sheets to Supabase.
  }
}

export function getSheetsSyncService(): SheetsSyncService {
  return new NoopSheetsSyncService()
}

