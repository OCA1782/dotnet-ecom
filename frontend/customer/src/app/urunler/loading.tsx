export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">

        {/* Sidebar skeleton — desktop only */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5 animate-pulse">
            {/* Search */}
            <div>
              <div className="h-3 bg-gray-200 rounded w-14 mb-2" />
              <div className="h-9 bg-gray-100 rounded-xl" />
            </div>
            {/* Sort */}
            <div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 bg-gray-100 rounded-xl mb-1" />
              ))}
            </div>
            {/* Categories */}
            <div>
              <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 bg-gray-100 rounded-xl mb-1" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
            {/* Price */}
            <div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="flex gap-2">
                <div className="h-9 bg-gray-100 rounded-xl flex-1" />
                <div className="h-9 bg-gray-100 rounded-xl flex-1" />
              </div>
              <div className="h-8 bg-gray-100 rounded-xl mt-2" />
            </div>
          </div>
        </aside>

        {/* Main content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter bar skeleton */}
          <div className="lg:hidden h-11 bg-gray-100 rounded-xl mb-4 animate-pulse" />

          {/* Results count + badge row */}
          <div className="flex items-center gap-2 mb-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-6 bg-gray-100 rounded-full w-20" />
            <div className="h-6 bg-gray-100 rounded-full w-16" />
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-3.5 bg-gray-200 rounded w-full" />
                  <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                  <div className="h-5 bg-gray-100 rounded w-2/5 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
