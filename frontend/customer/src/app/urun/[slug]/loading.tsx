export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Image gallery skeleton */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-100 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-5">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded w-full" />
            <div className="h-7 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="h-9 bg-gray-100 rounded w-1/3" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded w-full" />
            <div className="h-3.5 bg-gray-100 rounded w-5/6" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>

      </div>
    </div>
  );
}
