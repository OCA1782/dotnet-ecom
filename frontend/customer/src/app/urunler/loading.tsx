export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-9 bg-gray-100 rounded-xl" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mt-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </aside>

        {/* Product grid skeleton */}
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-200 rounded w-32 mb-5" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-100 rounded w-1/2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
