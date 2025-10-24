/**
 * Global type definitions for external analytics libraries.
 *
 * This file augments the global Window interface to provide TypeScript
 * type safety for third-party analytics integrations.
 */

export {}

declare global {
  /**
   * Window interface extensions for analytics tracking.
   */
  interface Window {
    /**
     * Vercel Analytics event tracking function.
     *
     * @see https://vercel.com/docs/analytics
     *
     * @example
     * ```ts
     * window.va('event', {
     *   name: 'button_click',
     *   data: { button_id: 'cta' }
     * })
     * ```
     */
    va?: (
      event: string,
      data: {
        /** Event name to track */
        name: string
        /** Event data payload */
        data: Record<string, unknown>
      }
    ) => void

    /**
     * Google Analytics gtag function for event tracking.
     *
     * @see https://developers.google.com/analytics/devguides/collection/gtagjs
     *
     * @example
     * ```ts
     * window.gtag('event', 'page_view', {
     *   page_path: '/dashboard'
     * })
     * ```
     */
    gtag?: (
      /** Command type (e.g., 'event', 'config') */
      command: string,
      /** Event name or tracking ID */
      eventName: string,
      /** Optional event parameters */
      params?: Record<string, unknown>
    ) => void
  }
}
