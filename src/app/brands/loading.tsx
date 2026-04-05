export default function BrandsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="mb-8 h-8 w-48 rounded bg-surface-container" />
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-3 rounded-xl border border-outline-variant p-6">
            <div className="h-16 w-32 rounded bg-surface-container" />
            <div className="h-4 w-24 rounded bg-surface-container" />
          </div>
        ))}
      </div>
    </div>
  )
}
