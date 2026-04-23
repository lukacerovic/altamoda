export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="mb-6 h-4 w-72 rounded bg-surface-container" />

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square rounded-[4px] bg-surface-container" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-20 rounded-[4px] bg-surface-container" />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-surface-container" />
          <div className="h-8 w-3/4 rounded bg-surface-container" />
          <div className="h-5 w-32 rounded bg-surface-container" />
          <div className="h-10 w-40 rounded bg-surface-container" />
          <div className="h-12 w-full rounded-lg bg-surface-container" />
          <div className="mt-8 space-y-2">
            <div className="h-4 w-full rounded bg-surface-container" />
            <div className="h-4 w-full rounded bg-surface-container" />
            <div className="h-4 w-2/3 rounded bg-surface-container" />
          </div>
        </div>
      </div>
    </div>
  )
}
