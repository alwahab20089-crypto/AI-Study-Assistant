const SummarySkeleton = ({ message }) => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 animate-pulse">
      <p className="text-sm font-medium text-violet-600 mb-4">{message}</p>
      <div className="space-y-2.5">
        <div className="h-4 bg-neutral-100 rounded w-1/3" />
        <div className="h-3 bg-neutral-100 rounded w-full" />
        <div className="h-3 bg-neutral-100 rounded w-5/6" />
        <div className="h-3 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-1/4 mt-4" />
        <div className="h-3 bg-neutral-100 rounded w-2/3" />
        <div className="h-3 bg-neutral-100 rounded w-3/4" />
      </div>
    </div>
  );
};

export default SummarySkeleton;