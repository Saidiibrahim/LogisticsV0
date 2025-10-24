import { Check, X } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "RefZone Plus",
    price: "$18",
    cadence: "per month",
    description: "Expanded tools for referees growing their match load.",
    cta: "Start 14-day trial",
    highlight: false,
    features: [
      "Automated match performance summaries",
      "Unlimited assignment notes",
      "Priority scheduling insights",
      "Video moment bookmarks",
      "1:1 onboarding session",
    ],
  },
  {
    name: "RefZone Pro",
    price: "$42",
    cadence: "per month",
    description: "Full platform access for officiating crews and coordinators.",
    cta: "Upgrade to Pro",
    highlight: true,
    features: [
      "Crew-wide analytics dashboards",
      "Advanced scouting reports",
      "Unlimited video storage",
      "API access for league systems",
      "Dedicated success manager",
    ],
  },
]

const planSwitchOptions = ["Personal", "Business"]

const isPricingEnabled =
  process.env.NEXT_PUBLIC_FEATURE_PRICING_PAGE_ENABLED === "true"

export default function PricingPage() {
  if (!isPricingEnabled) {
    redirect("/welcome")
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-50">
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:justify-center">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-10 w-10 rounded-full border border-neutral-800 bg-neutral-900/30 text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-100"
        >
          <Link href="/welcome">
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">Close pricing</span>
          </Link>
        </Button>

        <header className="flex flex-col items-center gap-5 text-center">
          <Badge className="border border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wide text-neutral-300">
            Preview
          </Badge>

          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose the plan that fits your crew
            </h1>
            <p className="text-sm text-neutral-400 sm:text-base">
              Placeholder content for pricing copy. Highlight how RefZone adapts
              to professional and grassroots officiating teams.
            </p>
          </div>

          <div className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/40 p-1 text-sm text-neutral-400">
            {planSwitchOptions.map((option) => (
              <span
                key={option}
                className={cn(
                  "rounded-full px-3 py-1",
                  option === "Personal"
                    ? "bg-neutral-800 text-neutral-100"
                    : "hover:text-neutral-200"
                )}
              >
                {option}
              </span>
            ))}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative h-full overflow-hidden border-neutral-800 bg-neutral-900/40 text-neutral-100 transition hover:border-neutral-700",
                plan.highlight && "border-primary bg-primary/10"
              )}
            >
              {plan.highlight ? (
                <div className="absolute right-5 top-5 text-xs font-semibold uppercase tracking-wide text-primary">
                  Most popular
                </div>
              ) : null}

              <CardHeader className="space-y-4">
                <CardTitle className="text-2xl font-semibold">
                  {plan.name}
                </CardTitle>
                <CardDescription className="!text-neutral-400">
                  {plan.description}
                </CardDescription>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold">{plan.price}</span>
                    <span className="text-sm text-neutral-400">
                      {plan.cadence}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    Placeholder pricing available for the beta release.
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Separator className="border-neutral-800" />

                <ul className="space-y-3 text-sm text-neutral-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        aria-hidden="true"
                        className="mt-1 h-4 w-4 text-primary"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto justify-between gap-3 border-t border-neutral-800 pt-6">
                <div className="text-xs text-neutral-500">
                  Placeholder CTA copy for the plan button.
                </div>
                <Button
                  className="min-w-[140px]"
                  variant={plan.highlight ? "default" : "secondary"}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        <footer className="grid gap-4 text-xs text-neutral-500 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            Billing support placeholder content. Outline response times and
            contact methods for questions about invoices.
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            Feature comparison placeholder. Summarize major differences between
            plans that we will refine later.
          </div>
        </footer>
      </div>
    </div>
  )
}
