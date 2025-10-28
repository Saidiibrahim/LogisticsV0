"use client"

/**
 * Chat Interface Component
 *
 * Main client component for the AI-powered chat interface with widget support.
 * Implements a responsive layout that switches between centered and split modes
 * based on widget activation.
 *
 * **Key Features:**
 * - Real-time streaming responses using AI SDK's useChat hook
 * - Tool invocation detection for widget display
 * - Dynamic layout switching (centered ↔ split)
 * - Error handling with retry functionality
 * - Keyboard shortcuts (Cmd/Ctrl+K for focus, Esc to close widget)
 * - Accessibility support with reduced motion preferences
 * - Polished UI using ai-elements components
 *
 * **Widget Detection Flow:**
 * 1. AI SDK streams response with tool invocations
 * 2. `onFinish` callback receives completed message
 * 3. `inspectMessageForTools` examines message parts
 * 4. Widget data extracted from tool output
 * 5. Layout switches to split mode
 * 6. Widget displays in right panel
 *
 * **AI SDK 5 Integration:**
 * - Uses `message.parts` array for tool detection (not deprecated toolInvocations)
 * - Filters for parts with `state === 'output-available'`
 * - Extracts WidgetToolResult from part.output
 * - Compatible with toUIMessageStreamResponse() format
 *
 * @module app/(authenticated)/chat/_components/chat-interface
 * @see {@link https://ai-sdk.dev/docs/ai-sdk-ui/chatbot|AI SDK useChat Documentation}
 */

import { useChat } from "@ai-sdk/react"
import { isToolUIPart, type UIMessage } from "ai"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { AlertCircle, GlobeIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Response } from "@/components/ai-elements/response"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  selectError,
  selectLayoutMode,
  useChatStore,
} from "@/lib/stores/chat-store"
import type { WidgetToolResult, WidgetType } from "@/lib/types/chat"
import { cn } from "@/lib/utils"
import { ChatWidgetPanel } from "./chat-widget-panel"

/**
 * Default widget titles by type.
 * Used when tool doesn't provide a custom displayText.
 */
const WIDGET_TITLES: Record<WidgetType, string> = {
  calendar: "Upcoming Events",
  "driver-performance": "Driver Performance",
  "performance-chart": "Performance Insights",
}

/**
 * Gets the display title for a widget type.
 *
 * @param type - Widget type identifier
 * @returns Display title for the widget
 */
const getWidgetTitle = (type: WidgetType) => WIDGET_TITLES[type] ?? "Widget"

const MODEL_OPTIONS = [
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-2", name: "Claude 2" },
  { id: "claude-instant", name: "Claude Instant" },
  { id: "palm-2", name: "PaLM 2" },
  { id: "llama-2-70b", name: "Llama 2 70B" },
  { id: "llama-2-13b", name: "Llama 2 13B" },
  { id: "cohere-command", name: "Command" },
  { id: "mistral-7b", name: "Mistral 7B" },
]

const DEFAULT_SUGGESTIONS = [
  "What are the latest trends in AI?",
  "How does machine learning work?",
  "Explain quantum computing",
  "Best practices for React development",
  "Tell me about TypeScript benefits",
  "How to optimize database queries?",
  "What is the difference between SQL and NoSQL?",
  "Explain cloud computing basics",
]

/**
 * Chat interface component.
 *
 * Renders the complete chat UI including message list, input field,
 * and optional widget panel. Manages chat state, handles user input,
 * and coordinates widget display based on AI tool invocations.
 *
 * @returns Rendered chat interface
 */
export function ChatInterface() {
  // Store subscriptions (using selectors for optimized re-renders)
  const layoutMode = useChatStore(selectLayoutMode)
  const error = useChatStore(selectError)
  const setError = useChatStore((state) => state.setError)
  const activeWidget = useChatStore((state) => state.activeWidget)
  const setActiveWidget = useChatStore((state) => state.setActiveWidget)
  const setLayoutMode = useChatStore((state) => state.setLayoutMode)
  const closeWidget = useChatStore((state) => state.closeWidget)

  // Accessibility: respect user's motion preferences
  const shouldReduceMotion = useReducedMotion()

  // Input field reference for focus management
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Local input state for PromptInput
  const [text, setText] = useState("")
  const [model, setModel] = useState(MODEL_OPTIONS[0]?.id ?? "gpt-4")
  const [useWebSearch, setUseWebSearch] = useState(false)

  // Auto-focus input on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  /**
   * Handles widget tool results from AI responses.
   *
   * When a tool returns widget data, this function:
   * 1. Validates the result has required properties
   * 2. Sets the active widget in the store
   * 3. Switches layout to split mode
   *
   * @param result - Widget tool result from AI SDK tool execution
   */
  const handleWidgetResult = useCallback(
    (result: WidgetToolResult | null | undefined) => {
      // Early return if result is invalid or missing widget type
      if (!result || !result.widgetType) {
        return
      }

      // Update store with widget configuration
      setActiveWidget({
        type: result.widgetType,
        data: result.widgetData ?? null,
        // Use displayText from tool or fall back to default title
        title: result.displayText ?? getWidgetTitle(result.widgetType),
      })

      // Switch to split layout to show widget panel
      setLayoutMode("split")
    },
    [setActiveWidget, setLayoutMode]
  )

  /**
   * Inspects a finished message for tool invocations with widget data.
   *
   * **AI SDK 5 Implementation:**
   * This function correctly implements widget detection for AI SDK 5 by:
   * 1. Checking the `message.parts` array (not deprecated toolInvocations)
   * 2. Filtering for tool UI parts using `isToolUIPart`
   * 3. Finding parts with `state === 'output-available'`
   * 4. Extracting the tool result from `part.output`
   *
   * **Why this approach:**
   * - AI SDK 5 uses a parts-based message structure
   * - Tool invocations are represented as typed parts
   * - The `output` property contains the tool's execute return value
   * - Only completed tools have 'output-available' state
   *
   * @param message - UIMessage from AI SDK with parts array
   */
  const inspectMessageForTools = useCallback(
    (message: UIMessage) => {
      // Early return if message has no parts
      if (!message.parts?.length) {
        return
      }

      // Filter for tool UI parts with completed output
      const toolParts = message.parts
        .filter(isToolUIPart) // Filter for tool-related parts
        .filter((part) => part.state === "output-available") // Only completed tools

      if (toolParts.length === 0) {
        return
      }

      // Get the most recent tool part (in case multiple tools were called)
      const latestPart = toolParts[toolParts.length - 1]
      const result = (latestPart.output ?? null) as WidgetToolResult | null

      // Development logging for debugging widget detection
      if (process.env.NODE_ENV === "development") {
        console.log("[Chat] Tool part detected:", {
          type: latestPart.type,
          state: latestPart.state,
          hasOutput: !!latestPart.output,
        })
      }

      handleWidgetResult(result)
    },
    [handleWidgetResult]
  )

  /**
   * AI SDK useChat hook.
   *
   * Manages chat state, message streaming, and API communication.
   *
   * **Important:** The `onFinish` callback receives an event object
   * in AI SDK 5, not the message directly. We destructure { message }
   * to extract the completed message.
   *
   * @see {@link https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat|useChat API Reference}
   */
  const { messages, status, sendMessage, clearError, stop } = useChat({
    /** Error handler for API or network errors */
    onError: (err) => {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to get a response. Please try again."
      setError(message)
    },
    /**
     * Callback when message streaming completes.
     *
     * **AI SDK 5 Change:** Receives an event object { message, messages, ... }
     * instead of the message directly. Must destructure to extract message.
     */
    onFinish: ({ message }) => {
      setError(null)
      inspectMessageForTools(message)
    },
  })

  /**
   * Dismisses the current error message.
   */
  const handleDismissError = useCallback(() => {
    clearError()
    setError(null)
  }, [clearError, setError])

  /**
   * Handles message submission from PromptInput.
   *
   * **Flow:**
   * 1. Validates message has text content
   * 2. Clears any existing errors
   * 3. Clears input field
   * 4. Returns focus to input field
   *
   * @param message - PromptInputMessage from ai-elements
   */
  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (status === "streaming" || status === "submitted") {
        try {
          await stop()
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[Chat] Failed to stop streaming response", err)
          }
        }
        return
      }

      const trimmedText = message.text?.trim() ?? ""
      const hasText = trimmedText.length > 0
      const hasAttachments = Boolean(message.files?.length)

      if (!hasText && !hasAttachments) {
        return
      }

      // Clear any previous errors
      if (error) {
        clearError()
        setError(null)
      }

      const previousText = message.text ?? ""

      // Clear input (PromptInput handles sending via useChat internally)
      setText("")

      if (hasAttachments && message.files) {
        const count = message.files.length
        toast.success("Files attached", {
          description: `${count} file${count === 1 ? "" : "s"} attached to message`,
        })
      }

      try {
        const payload: Parameters<typeof sendMessage>[0] = {
          text: hasText ? previousText : "",
          ...(hasAttachments && message.files ? { files: message.files } : {}),
        }

        await sendMessage(payload)
      } catch (err) {
        setText(previousText)
        const message =
          err instanceof Error
            ? err.message
            : "Failed to send your message. Please try again."
        setError(message)
      } finally {
        // Return focus to input
        textareaRef.current?.focus()
      }
    },
    [status, stop, error, clearError, sendMessage, setError]
  )

  const handleSuggestionClick = useCallback(
    async (suggestion: string) => {
      if (status === "streaming" || status === "submitted") {
        try {
          await stop()
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[Chat] Failed to stop streaming response", err)
          }
        }
        return
      }

      if (error) {
        clearError()
        setError(null)
      }

      setText("")

      try {
        await sendMessage({ text: suggestion })
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to send your message. Please try again."
        setError(message)
      } finally {
        textareaRef.current?.focus()
      }
    },
    [status, stop, error, clearError, sendMessage, setError]
  )

  /**
   * Helper to extract text content from a message.
   *
   * @param message - UIMessage from AI SDK
   * @returns Text content string
   */
  const extractTextContent = useCallback((message: UIMessage) => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { type: "text"; text: string }).text)
      .join("")
  }, [])

  /**
   * Keyboard shortcut handlers.
   *
   * **Shortcuts:**
   * - `Cmd/Ctrl + K`: Focus input field (global shortcut pattern)
   * - `Escape`: Close active widget panel
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus input
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        textareaRef.current?.focus()
      }

      // Escape to close widget
      if (event.key === "Escape" && activeWidget) {
        event.preventDefault()
        closeWidget()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeWidget, closeWidget])

  const isChatBusy = status === "streaming" || status === "submitted"

  return (
    <div
      className="flex h-[calc(100vh-4rem)] flex-col"
      data-layout={layoutMode}
    >
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          layoutMode === "split" && "overflow-hidden"
        )}
      >
        {layoutMode === "split" ? (
          <div className="grid h-full grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="flex h-full flex-col border-r">
              <div className="flex-1 overflow-hidden">
                <div className="mx-auto h-full max-w-3xl">
                  <Conversation className="h-full">
                    <ConversationContent>
                      {/* Error banner */}
                      {error && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription className="flex items-center justify-between gap-2">
                            <span>{error}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleDismissError}
                            >
                              Dismiss
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Empty state */}
                      {messages.length === 0 && (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <h2 className="text-2xl font-semibold">
                              Start a conversation
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Ask anything about your deliveries, routes, or
                              driver performance.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Messages */}
                      {messages.map((message) => (
                        <Message
                          key={message.id}
                          from={message.role === "user" ? "user" : "assistant"}
                        >
                          <MessageContent>
                            <Response>{extractTextContent(message)}</Response>
                          </MessageContent>
                          <MessageAvatar
                            name={message.role === "user" ? "You" : "Assistant"}
                            src={
                              message.role === "user"
                                ? "https://github.com/haydenbleasel.png"
                                : "https://github.com/openai.png"
                            }
                          />
                        </Message>
                      ))}
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>
                </div>
              </div>
            </div>
            <div className="flex h-full flex-col overflow-hidden bg-muted/30">
              <AnimatePresence mode="wait" initial={false}>
                {activeWidget ? (
                  <ChatWidgetPanel
                    key={`widget-${activeWidget.type}`}
                    widget={activeWidget}
                  />
                ) : (
                  <motion.div
                    key="widget-empty"
                    className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    No widget to display yet.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <div className="mx-auto h-full max-w-3xl">
                <Conversation className="h-full">
                  <ConversationContent>
                    {/* Error banner */}
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription className="flex items-center justify-between gap-2">
                          <span>{error}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDismissError}
                          >
                            Dismiss
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Empty state */}
                    {messages.length === 0 && (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <h2 className="text-2xl font-semibold">
                            Start a conversation
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Ask anything about your deliveries, routes, or
                            driver performance.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((message) => (
                      <Message
                        key={message.id}
                        from={message.role === "user" ? "user" : "assistant"}
                      >
                        <MessageContent>
                          <Response>{extractTextContent(message)}</Response>
                        </MessageContent>
                        <MessageAvatar
                          name={message.role === "user" ? "You" : "Assistant"}
                          src={
                            message.role === "user"
                              ? "https://github.com/haydenbleasel.png"
                              : "https://github.com/openai.png"
                          }
                        />
                      </Message>
                    ))}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={cn(layoutMode === "split" && "lg:grid lg:grid-cols-2")}>
        <div
          className={cn(
            layoutMode === "split" && "lg:border-r lg:border-border/50"
          )}
        >
          <div className="sticky bottom-0 bg-background/80 px-4 py-6 backdrop-blur-sm">
            <div className="mx-auto max-w-3xl space-y-4">
              <Suggestions className="flex flex-wrap gap-2">
                {DEFAULT_SUGGESTIONS.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    suggestion={suggestion}
                  />
                ))}
              </Suggestions>
              <PromptInput
                globalDrop
                multiple
                onSubmit={handleSubmit}
                className="rounded-xl border border-border/50 bg-background/60 shadow-sm transition-colors"
              >
                <PromptInputBody>
                  <PromptInputAttachments className="px-3">
                    {(attachment) => (
                      <PromptInputAttachment
                        key={attachment.id}
                        data={attachment}
                      />
                    )}
                  </PromptInputAttachments>
                  <PromptInputTextarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What would you like to know?"
                    disabled={Boolean(error)}
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools className="gap-2">
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <PromptInputSpeechButton
                      onTranscriptionChange={setText}
                      textareaRef={textareaRef}
                    />
                    <PromptInputButton
                      onClick={() => setUseWebSearch((prev) => !prev)}
                      variant={useWebSearch ? "default" : "ghost"}
                    >
                      <GlobeIcon size={16} />
                      <span>Search</span>
                    </PromptInputButton>
                    <PromptInputModelSelect
                      onValueChange={setModel}
                      value={model}
                    >
                      <PromptInputModelSelectTrigger>
                        <PromptInputModelSelectValue />
                      </PromptInputModelSelectTrigger>
                      <PromptInputModelSelectContent>
                        {MODEL_OPTIONS.map((option) => (
                          <PromptInputModelSelectItem
                            key={option.id}
                            value={option.id}
                          >
                            {option.name}
                          </PromptInputModelSelectItem>
                        ))}
                      </PromptInputModelSelectContent>
                    </PromptInputModelSelect>
                  </PromptInputTools>
                  <PromptInputSubmit
                    disabled={Boolean(error) || (!text.trim() && !isChatBusy)}
                    status={status}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
        {layoutMode === "split" && (
          <div className="hidden bg-muted/30 lg:block" />
        )}
      </div>
    </div>
  )
}
