export default function AppLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        <div className="h-4 w-72 bg-stone-100 dark:bg-stone-800/60 rounded-lg" />
      </div>

      {/* Hero / Banner Skeleton */}
      <div className="h-40 sm:h-48 w-full rounded-3xl bg-stone-200 dark:bg-stone-800/80" />

      {/* Quick Cards Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="h-28 rounded-2xl bg-stone-200 dark:bg-stone-800/70" />
        <div className="h-28 rounded-2xl bg-stone-200 dark:bg-stone-800/70" />
        <div className="h-28 rounded-2xl bg-stone-200 dark:bg-stone-800/70" />
        <div className="h-28 rounded-2xl bg-stone-200 dark:bg-stone-800/70" />
      </div>

      {/* List Items Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="h-16 rounded-2xl bg-stone-100 dark:bg-stone-800/50" />
        <div className="h-16 rounded-2xl bg-stone-100 dark:bg-stone-800/50" />
        <div className="h-16 rounded-2xl bg-stone-100 dark:bg-stone-800/50" />
      </div>
    </div>
  );
}
