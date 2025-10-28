# Purpose / Big Picture

Deliver a production-ready chat surface that both triggers backend responses and presents the ai-elements inspired composer. Users will be able to submit prompts, receive streamed answers, and interact with quick suggestions and controls that match the new visual direction.

# Suprises & Discoveries

- Observation: `handleSubmit` clears local state without calling `sendMessage`, so no requests ever reach the server.
- Evidence: Current code in `app/(authenticated)/chat/_components/chat-interface.tsx` lines 220-284 no longer references the hook's `sendMessage`.

# Decision Log

- Decision: Follow the ai-elements reference layout for the composer, including suggestions and tool controls.
- Rationale: Keeps UX consistent with the design target and reuses existing prefab components.
- Date/Author: 2025-02-14 / Codex

# Outcomes & Retrospective

Pending implementation.

# Context and Orientation

The chat page lives in `app/(authenticated)/chat/_components/chat-interface.tsx`. It uses the AI SDK `useChat` hook and global state from `@/lib/stores/chat-store.ts`. Supporting widgets render via `ChatWidgetPanel`. Previous components `ChatInput` and `ChatMessageList` have been bypassed in favor of ai-elements primitives located under `components/ai-elements/`. The current refactor dropped the actual send call and trimmed UI features present in the reference example.

# Plan of Work

Reintegrate the `useChat` submission flow by destructuring `sendMessage` (and retry helpers) and wiring `handleSubmit` to invoke it, handling errors and attachments. Restore UI polish by porting suggestion chips, attachment handling, speech/search/model controls, and placeholder styling from the ai-elements example into the composer, adding any local state needed. Ensure the conversation body still renders messages and streaming updates correctly after layout adjustments, then update retry/dismiss interactions to use the hook. Finish with validation via manual testing and lint/tests.

# Concrete Steps

Documented in `.agent/tasks/chat-interface-makeover/`.

# Progress

- [x] (TASK_01_chat-interface-makeover.md) (2025-02-14 11:05) Audited prior implementation and catalogued missing ai-elements controls.
- [x] (TASK_02_chat-interface-makeover.md) (2025-02-14 11:45) Reinstated `sendMessage` flow with attachment handling, stop control, and error recovery.
- [ ] (TASK_03_chat-interface-makeover.md) In progress — composer polish landed; `pnpm lint` currently blocked by pre-existing calendar errors (see log).

# Testing Approach

Manual QA: submit user-typed prompt, click suggestion chip, toggle search/model selections, and confirm streamed assistant reply. Run `pnpm lint` and `pnpm test` to guard regressions.

# Constraints & Considerations

- Must avoid regressing widget detection logic and layout modes.
- Follow ui primitives from `components/ai-elements/` before introducing new code.
