export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[60vh] bg-surface-container" />

      {/* Product section skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 h-8 w-48 rounded bg-surface-container" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square rounded-lg bg-surface-container" />
              <div className="h-4 w-3/4 rounded bg-surface-container" />
              <div className="h-4 w-1/2 rounded bg-surface-container" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
