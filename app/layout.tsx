import { Analytics } from "@vercel/analytics/next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/use-toast"
import "./globals.css"

/**
 * Static metadata shared across all routes so that search engines and social
 * cards consistently describe the LogisticsHub application.
 */
export const metadata: Metadata = {
  title: "LogisticsHub",
  description: "Professional driver and fleet management platform",
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
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
        <WebVitalsReporter />
        <Analytics />
      </body>
    </html>
  )
}
