/**
 * Route segment configuration for the settings page.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const dynamic = "force-dynamic"

import { SettingsContent } from "./_components/settings-content"

/**
 * Account settings page for authenticated users.
 *
 * This server component delegates rendering to the SettingsContent client component,
 * which accesses user data from the UserContext (provided by the authenticated layout).
 *
 * @remarks
 * Performance consideration: This page previously called `getSessionClaims()` directly,
 * causing a redundant API call since the layout already fetches session data. The new
 * architecture uses React Context to share the session data without additional requests.
 *
 * Route configuration:
 * - `dynamic = 'force-dynamic'`: Ensures fresh content on each request
 * - Wrapped by authenticated layout which handles session verification
 *
 * @returns The rendered settings page
 */
export default function SettingsPage() {
  return <SettingsContent />
}
