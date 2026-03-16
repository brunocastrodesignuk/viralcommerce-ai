export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="card flex items-center gap-3 flex-wrap">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="card h-80 animate-pulse"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="h-44 bg-gray-800 rounded-lg mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-4/5" />
              <div className="h-4 bg-gray-800 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
