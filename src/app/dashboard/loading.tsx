export default function DashboardLoading() {
  return (
    <div className="lg:pl-[252px]">
      <div className="mx-auto w-full max-w-[1120px] px-5 pt-10 sm:px-8 lg:pt-14">
        <div className="h-3 w-24 animate-pulse rounded bg-paper-deep" />
        <div className="mt-3 h-9 w-52 animate-pulse rounded bg-paper-deep" />
        <div className="mt-8 h-9 w-full animate-pulse rounded bg-paper-deep/70" />
        <div className="mt-6 space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-[68px] animate-pulse rounded-xl border border-line bg-surface/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
