export default function CheckoutLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-40 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 lg:self-start">
          <div className="h-4 bg-gray-200 rounded w-28" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3.5 bg-gray-100 rounded w-1/3" />
              <div className="h-3.5 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="h-11 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
