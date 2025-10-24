export const revalidate = 3600

/**
 * Resource library view dedicated to performance assessments and referee
 * reports collected from assessors.
 */
export default function AssessmentsPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          Review and track performance assessments and reports
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
        <p className="text-center text-muted-foreground">
          Assessment records will appear here soon
        </p>
      </div>
    </div>
  )
}
