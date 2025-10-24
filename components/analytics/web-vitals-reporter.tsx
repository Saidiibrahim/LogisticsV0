"use client"

import { useReportWebVitals } from "next/web-vitals"

/**
 * Component that reports Core Web Vitals metrics to analytics platforms.
 *
 * This component integrates with Next.js's Web Vitals instrumentation to capture
 * real user performance data. It supports multiple analytics destinations:
 * - Development console logging for debugging
 * - Vercel Analytics for production monitoring
 * - Google Analytics for cross-platform tracking
 *
 * Core Web Vitals Tracked:
 * - **CLS** (Cumulative Layout Shift): Visual stability
 * - **FID** (First Input Delay): Interactivity
 * - **FCP** (First Contentful Paint): Loading performance
 * - **LCP** (Largest Contentful Paint): Loading performance
 * - **TTFB** (Time to First Byte): Server response time
 * - **INP** (Interaction to Next Paint): Responsiveness
 *
 * @remarks
 * This component should be placed in the root layout to capture metrics for all routes.
 * It renders nothing (returns null) and exists solely for side effects.
 *
 * Performance Impact: Minimal - metrics are captured asynchronously after page load.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <WebVitalsReporter />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @see https://web.dev/vitals/
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/analytics
 *
 * @returns null - This component renders nothing
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Development: Log metrics to console for debugging
    if (process.env.NODE_ENV !== "production") {
      console.info(`[web-vitals] ${metric.name}`, {
        id: metric.id,
        value: metric.value,
        label: metric.label,
      })
    }

    // Production: Send to Vercel Analytics if available
    // @see https://vercel.com/docs/analytics
    if (window?.va) {
      window.va("event", {
        name: metric.name,
        data: {
          value: Math.round(metric.value),
          metric_id: metric.id,
          metric_label: metric.label,
          metric_rating: metric.rating,
        },
      })
    }

    // Production: Send to Google Analytics if configured
    // @see https://developers.google.com/analytics/devguides/collection/gtagjs
    if (window?.gtag) {
      window.gtag("event", metric.name, {
        value: Math.round(metric.value),
        event_category: "Web Vitals",
        event_label: metric.id,
        metric_rating: metric.rating,
        non_interaction: true,
      })
    }
  })

  return null
}
