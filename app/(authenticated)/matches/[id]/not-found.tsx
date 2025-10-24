import { FileQuestion } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function MatchNotFound() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <FileQuestion className="mx-auto size-12 text-muted-foreground" />
          <h3 className="font-semibold text-lg">Match Not Found</h3>
          <p className="text-muted-foreground text-sm">
            We could not locate that match or you do not have permission to view
            it.
          </p>
          <Button asChild>
            <Link href="/matches">Back to Matches</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
