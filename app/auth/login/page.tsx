import { HeroIllustration } from "@/components/hero-illustration"
import { LoginForm } from "@/components/login-form"

/**
 * Renders the login form centered within the viewport for returning drivers and logistics managers.
 */
export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground lg:flex-row">
      <section className="flex flex-1 items-center justify-center px-6 py-12 md:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-md flex-col gap-10">
          <header className="space-y-4 text-center lg:text-left">
            <span className="inline-flex w-fit items-center justify-center rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              CourierRun
            </span>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Logistics made simple.
            </h1>
            <p className="text-base text-muted-foreground">
              Sign in to manage shifts, track driver schedules, and keep your fleet running smoothly.
            </p>
          </header>
          <LoginForm className="mx-auto w-full max-w-sm lg:mx-0" />
        </div>
      </section>
      <aside className="flex flex-1 items-center justify-center px-6 py-12 md:px-12 lg:px-16">
        <div className="relative w-full max-w-xl">
          <div
            aria-hidden="true"
            className="absolute -inset-12 -z-10 rounded-[48px] bg-gradient-to-br from-orange-500/20 via-rose-400/10 to-amber-500/20 blur-3xl"
          />
          <HeroIllustration className="shadow-2xl" />
        </div>
      </aside>
    </div>
  )
}
