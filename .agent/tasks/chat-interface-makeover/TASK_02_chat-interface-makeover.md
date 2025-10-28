---
task_id: 02
plan_id: PLAN_chat-interface-makeover
plan_file: ../../plans/chat-interface-makeover/PLAN_chat-interface-makeover.md
title: Reinstate chat submission flow
phase: Phase 2 - Functional Fixes
---

- Restore `sendMessage` (and related helpers) from `useChat` and rewire `handleSubmit`.
- Ensure attachments and error paths are handled before clearing the input.
- Validate retry/dismiss routines still work with the updated flow.
