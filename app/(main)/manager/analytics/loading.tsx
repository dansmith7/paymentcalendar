export default function LoadingManagerAnalytics() {
  return (
    <section className="space-y-3">
      <div className="h-7 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </section>
  )
}

