import { Skeleton } from "@/components/ui/skeleton"

export default function MatchesLoading() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-60" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="space-y-8">
        {[0, 1].map((section) => (
          <div key={section} className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((card) => (
                <Skeleton key={card} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
