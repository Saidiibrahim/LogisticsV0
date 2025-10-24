/**
 * Chat API Route
 *
 * Next.js API route that handles AI-powered chat interactions using the Vercel AI SDK.
 * This endpoint integrates with OpenAI's GPT-4 and provides tools for displaying
 * visual widgets in the chat interface.
 *
 * **Architecture:**
 * - Uses AI SDK's `streamText` for streaming responses
 * - Implements tool calling for widget-based responses
 * - Returns UI-compatible message stream via `toUIMessageStreamResponse()`
 * - Requires authentication via Supabase
 *
 * **Tool Calling Flow:**
 * 1. Client sends message via useChat hook
 * 2. OpenAI determines if a tool should be called
 * 3. Tool executes and returns WidgetToolResult
 * 4. Result is streamed to client as tool output part
 * 5. Client detects tool output and displays widget
 *
 * @module app/api/chat/route
 * @see {@link https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling|AI SDK Tool Calling}
 */

import { openai } from "@ai-sdk/openai"
import type { UIMessage } from "ai"
import { convertToModelMessages, streamText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { createChatTools } from "@/tools/chat"

/**
 * System prompt for the AI assistant.
 *
 * Defines the assistant's role, capabilities, and behavior. The prompt
 * explicitly mentions tool availability to encourage appropriate tool usage.
 */
const SYSTEM_PROMPT = `You are a helpful assistant for CourierRun, a logistics management platform.

You help users with:
- Delivery insights and statistics
- Weekly roster planning and suggestions
- Driver performance tracking
- Fleet management and vehicle assignments
- Route optimization and delivery scheduling

You have access to tools to display visual widgets when users request data that would be better shown visually. Use these tools when appropriate.

Keep responses concise, actionable, and focused on logistics operations.`

/**
 * Request body type for chat API.
 *
 * Matches the AI SDK's expected message format with parts array.
 * The parts array contains message content including text and tool invocations.
 */
type ChatRequestBody = {
  messages: Array<Omit<UIMessage, "id">>
}

/**
 * POST handler for chat messages.
 *
 * Processes incoming chat messages and streams AI responses with tool support.
 * Requires user authentication via Supabase.
 *
 * **Response Format:**
 * - Content-Type: text/plain; charset=utf-8
 * - Body: UI message stream (Server-Sent Events format)
 * - Includes tool invocation parts when tools are called
 *
 * @param req - Next.js request object
 * @returns Stream response or error
 *
 * @example
 * ```typescript
 * // Client-side usage with useChat:
 * const { messages, sendMessage } = useChat({
 *   api: '/api/chat'
 * })
 * ```
 */
export async function POST(req: Request) {
  try {
    // Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Parse and validate request body
    const body = (await req.json()) as ChatRequestBody | null

    if (!body || !Array.isArray(body.messages)) {
      return new Response("Invalid request body", { status: 400 })
    }

    // Assemble real chat tools backed by Supabase data access
    const tools = createChatTools({
      supabase,
      userId: user.id,
    })

    // Stream AI response with tool support
    const result = streamText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      // Convert UI messages to model-compatible format
      messages: convertToModelMessages(body.messages),
      temperature: 0.7,
      // Tool definitions backed by Supabase queries
      tools,
    })

    /**
     * Convert the stream result to a UI message stream response.
     *
     * This method formats the stream for consumption by the useChat hook
     * on the client side. It includes:
     * - Text content parts
     * - Tool invocation parts (with input, output, state)
     * - Proper Server-Sent Events formatting
     */
    return result.toUIMessageStreamResponse()
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error("/api/chat POST error", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
