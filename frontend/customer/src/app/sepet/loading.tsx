export default function CartLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-3">
              <div className="w-4 h-4 bg-gray-200 rounded mt-1 shrink-0" />
              <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="h-7 bg-gray-100 rounded-lg w-28 mt-2" />
              </div>
              <div className="text-right space-y-1.5 shrink-0">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          ))}
          {/* Coupon section skeleton */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 mt-2">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        </div>
        <div>
          <div className="bg-white border border-slate-100 rounded-xl p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/2" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                <div className="h-3.5 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
