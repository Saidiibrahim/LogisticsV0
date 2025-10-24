import { Analytics } from "@vercel/analytics/next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

/**
 * Static metadata shared across all routes so that search engines and social
 * cards consistently describe the RefZone Pro application.
 */
export const metadata: Metadata = {
  title: "RefZone",
  description: "Professional referee management dashboard",
  generator: "v0.app",
  icons: {
    icon: [{ rel: "icon", type: "image/svg+xml", url: "/favicon.svg" }],
    shortcut: ["/favicon.svg"],
  },
}

/**
 * Root layout applied to every route. It wires up global fonts, sets the
 * document language, and wraps the application with the theme provider so dark
 * mode preferences persist across pages.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          {children}
        </ThemeProvider>
        <WebVitalsReporter />
        <Analytics />
      </body>
    </html>
  )
}
