export default function ColorsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="mb-8 h-8 w-56 rounded bg-surface-container" />
      <div className="mb-6 flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-28 rounded-full bg-surface-container" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-10">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square rounded-full bg-surface-container" />
            <div className="mx-auto h-3 w-10 rounded bg-surface-container" />
          </div>
        ))}
      </div>
    </div>
  )
}
