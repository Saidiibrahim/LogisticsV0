import { type RenderOptions, render } from "@testing-library/react"
import type { PropsWithChildren, ReactElement } from "react"
import { ThemeProvider } from "@/components/theme-provider"

const DefaultProviders = ({ children }: PropsWithChildren) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {children}
  </ThemeProvider>
)

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => <DefaultProviders>{children}</DefaultProviders>,
    ...options,
  })
}
