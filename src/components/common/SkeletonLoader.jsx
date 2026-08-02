const SkeletonLoader = ({ type = 'table', rows = 5 }) => {
  if (type === 'table') {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
        {[...Array(rows)].map((_, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="h-12 bg-slate-100 rounded-xl flex-1"></div>
            <div className="h-12 bg-slate-100 rounded-xl flex-1"></div>
            <div className="h-12 bg-slate-100 rounded-xl flex-1"></div>
            <div className="h-12 bg-slate-100 rounded-xl w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(rows)].map((_, idx) => (
          <div key={idx} className="border border-slate-200/80 bg-white p-6 rounded-2xl space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    </div>
  );
};

export default SkeletonLoader;
