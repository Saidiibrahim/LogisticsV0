import { SignUpForm } from "@/components/sign-up-form"

/**
 * Presents the registration form for new drivers and logistics managers to create their CourierRun
 * account.
 */
export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  )
}
