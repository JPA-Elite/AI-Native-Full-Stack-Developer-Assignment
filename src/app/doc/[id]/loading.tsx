export default function DocumentLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="h-14 border-b border-line bg-surface/80" />
      <div className="mx-auto w-full max-w-[840px] px-3 pt-8 sm:px-6">
        <div className="h-9 w-2/3 animate-pulse rounded bg-paper-deep" />
        <div className="mt-8 rounded-2xl border border-line bg-surface px-10 py-12">
          <div className="h-10 w-3/4 animate-pulse rounded bg-paper-deep" />
          <div className="mt-8 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((line) => (
              <div
                key={line}
                className="h-4 animate-pulse rounded bg-paper-deep/70"
                style={{ width: `${[100, 92, 97, 88, 95, 60][line]}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
