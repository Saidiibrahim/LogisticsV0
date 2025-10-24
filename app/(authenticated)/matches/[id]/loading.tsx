import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MatchDetailLoading() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <Skeleton className="h-9 w-32" />

      <div className="space-y-4">
        <Skeleton className="mx-auto h-6 w-24" />
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-center">
          <div className="flex-1 space-y-2">
            <Skeleton className="mx-auto h-8 w-40 md:mx-0" />
            <Skeleton className="mx-auto h-4 w-24 md:mx-0" />
          </div>
          <Skeleton className="h-16 w-36" />
          <div className="flex-1 space-y-2">
            <Skeleton className="mx-auto h-8 w-40 md:mx-0" />
            <Skeleton className="mx-auto h-4 w-24 md:mx-0" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
