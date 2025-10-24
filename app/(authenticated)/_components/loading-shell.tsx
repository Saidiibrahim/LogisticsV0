import { Skeleton } from "@/components/ui/skeleton"

interface LoadingShellProps {
  showSecondary?: boolean
}

export function LoadingShell({ showSecondary = true }: LoadingShellProps = {}) {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-24 w-full" key={index} />
        ))}
      </div>

      {showSecondary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </div>
  )
}
