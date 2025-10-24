import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorPageProps {
  searchParams: Promise<{ error: string }>
}

/**
 * Displays Supabase authentication errors, surfacing any error code supplied in
 * the callback query string to assist with debugging.
 */
export default async function Page({ searchParams }: ErrorPageProps) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-muted-foreground text-sm">
                  Code error: {params.error}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  An unspecified error occurred.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
