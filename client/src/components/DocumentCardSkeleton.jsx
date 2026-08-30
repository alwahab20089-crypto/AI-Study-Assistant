const DocumentCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-100 rounded w-3/4" />
          <div className="h-3 bg-neutral-100 rounded w-1/2" />
          <div className="h-3 bg-neutral-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};

export default DocumentCardSkeleton;