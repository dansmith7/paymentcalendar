alter table public.payment_requests
  add column if not exists sync_status text
    check (sync_status in ('pending', 'synced', 'failed')),
  add column if not exists external_id text,
  add column if not exists last_synced_at timestamptz;

create index if not exists idx_payment_requests_sync_status
  on public.payment_requests (sync_status);

