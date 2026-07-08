export default function HomeLoading() {
  return (
    <div className="bg-[#f3f4f6] animate-pulse">
      {/* Top bar */}
      <div className="bg-[#1c1f2e] h-8" />

      {/* Brand pill nav */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-100 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Hot parts strip */}
      <div className="bg-[#fff7ed] border-b border-orange-100 h-9" />

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="rounded-2xl bg-gray-200 h-64 sm:h-80 w-full" />
      </div>

      {/* Category pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 w-28 bg-white rounded-2xl border border-gray-100 shrink-0" />
        ))}
      </div>

      {/* Section title + product grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded-lg w-2/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
