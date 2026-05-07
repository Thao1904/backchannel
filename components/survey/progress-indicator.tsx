type ProgressIndicatorProps = {
  current: number;
  total: number;
};

export function ProgressIndicator({
  current,
  total,
}: ProgressIndicatorProps) {
  const percentage = total <= 0 ? 0 : (current / total) * 100;

  return (
    <div className="mb-8 flex items-center gap-4 sm:mb-10">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-[#ff4fc0]/75 transition-[width] duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="min-w-16 text-right text-[13px] font-bold text-black/55">
        {current}/{total}
      </p>
    </div>
  );
}
