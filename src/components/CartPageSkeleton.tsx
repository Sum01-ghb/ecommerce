export default function CartPageSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start animate-pulse">
      {}
      <div className="flex-1 min-w-0">
        <div className="h-4 w-20 bg-light-300 rounded-sm mb-4" />
        <div className="bg-light-100 border border-light-300 rounded-sm px-4 sm:px-6 divide-y divide-light-300">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-light-300 rounded-sm flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-3/4 bg-light-300 rounded-sm" />
                <div className="h-3 w-1/3 bg-light-300 rounded-sm" />
                <div className="h-3 w-2/5 bg-light-300 rounded-sm" />
              </div>
              <div className="flex flex-col items-end gap-8">
                <div className="h-4 w-16 bg-light-300 rounded-sm" />
                <div className="h-5 w-5 bg-light-300 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="w-full lg:w-80 xl:w-96 bg-light-100 border border-light-300 rounded-sm p-6 space-y-4">
        <div className="h-5 w-24 bg-light-300 rounded-sm" />
        <div className="h-3 w-full bg-light-300 rounded-sm" />
        <div className="h-3 w-full bg-light-300 rounded-sm" />
        <div className="border-t border-light-300 pt-4">
          <div className="h-4 w-full bg-light-300 rounded-sm" />
        </div>
        <div className="h-12 w-full bg-light-300 rounded-full mt-2" />
      </div>
    </div>
  );
}