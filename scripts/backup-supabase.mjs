import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { createClient } from "@supabase/supabase-js"

const TABLES = [
  "profiles",
  "finance_groups",
  "payment_requests",
  "payment_request_audit",
]

function parseEnv(text) {
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
  return env
}

async function fetchTable(supabase, table) {
  const rows = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, to)

    if (error) {
      return { ok: false, error: error.message, rows }
    }

    const page = data ?? []
    rows.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }

  return { ok: true, rows }
}

const env = {
  ...process.env,
  ...parseEnv(await readFile(".env.local", "utf8")),
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const startedAt = new Date().toISOString()
const backup = {
  metadata: {
    started_at: startedAt,
    completed_at: null,
    supabase_url: supabaseUrl,
    tables: TABLES,
  },
  tables: {},
}

for (const table of TABLES) {
  const result = await fetchTable(supabase, table)
  backup.tables[table] = {
    ok: result.ok,
    row_count: result.rows.length,
    rows: result.rows,
    error: result.error ?? null,
  }
}

backup.metadata.completed_at = new Date().toISOString()

await mkdir("backups", { recursive: true })
const stamp = startedAt.replace(/[:.]/g, "-")
const outputPath = join("backups", `supabase-backup-${stamp}.json`)
await writeFile(outputPath, `${JSON.stringify(backup, null, 2)}\n`)

console.log(outputPath)
for (const table of TABLES) {
  const item = backup.tables[table]
  console.log(`${table}: ${item.ok ? "ok" : "error"} (${item.row_count} rows)${item.error ? ` - ${item.error}` : ""}`)
}
