/**
 * Chat Page
 *
 * Entry point for the AI-powered chat interface. This page is protected
 * by the authentication middleware and provides an interactive conversation
 * experience with widget-based responses.
 *
 * **Features:**
 * - AI-powered responses using OpenAI GPT-4
 * - Dynamic widget display in split-view layout
 * - Real-time streaming responses
 * - Tool-based visualizations (calendar, stats, training summary)
 *
 * **Architecture:**
 * - Server component (Next.js 15 App Router)
 * - Authentication enforced by middleware
 * - Renders client-side ChatInterface component
 * - Force-dynamic to ensure fresh data on each request
 *
 * @module app/(authenticated)/chat/page
 * @see {@link ChatInterface} for the main client component
 */

import { ChatInterface } from "./_components/chat-interface"

/**
 * Force dynamic rendering to ensure authentication is checked on every request.
 * This prevents caching issues with protected routes.
 */
export const dynamic = "force-dynamic"

/**
 * Chat page component.
 *
 * Server component that serves as the container for the chat interface.
 * Authentication is handled by the middleware, so this component can
 * safely assume the user is authenticated.
 *
 * @returns Rendered chat interface
 */
export default function ChatPage() {
  return <ChatInterface />
}
