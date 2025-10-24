import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import { CreateMatchForm } from "./_components/create-match-form"

export default function CreateMatchPage() {
  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/matches">
          <ArrowLeft className="mr-2 size-4" />
          Back to Matches
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Schedule Match</h1>
        <p className="text-muted-foreground">
          Create a new scheduled assignment for your upcoming fixtures.
        </p>
      </div>

      <CreateMatchForm />
    </div>
  )
}
