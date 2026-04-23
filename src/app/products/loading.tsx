export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 h-4 w-64 rounded bg-surface-container" />

      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <div className="hidden w-64 shrink-0 space-y-6 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-24 rounded bg-surface-container" />
              <div className="h-4 w-full rounded bg-surface-container" />
              <div className="h-4 w-3/4 rounded bg-surface-container" />
              <div className="h-4 w-1/2 rounded bg-surface-container" />
            </div>
          ))}
        </div>

        {/* Product grid skeleton */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-surface-container" />
            <div className="h-9 w-40 rounded bg-surface-container" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square rounded-[4px] bg-surface-container" />
                <div className="h-4 w-3/4 rounded bg-surface-container" />
                <div className="h-3 w-1/2 rounded bg-surface-container" />
                <div className="h-5 w-1/3 rounded bg-surface-container" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
