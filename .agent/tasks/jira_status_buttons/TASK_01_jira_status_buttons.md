---
task_id: 01
plan_id: PLAN_jira_status_buttons
plan_file: ../../plans/jira_status_buttons/PLAN_jira_status_buttons.md
title: Extend status update contract
phase: Phase 1 - Backend & Types
---

## Goal

Ensure calendar status updates can carry resolution metadata. Update shared types and the `updateEventStatus` server action accordingly.

## Steps

1. Update `lib/types/calendar.ts` to include optional `resolutionType`, `resolutionNotes`, and `resolvedAt` on `CalendarEvent`.
2. Extend `EventStatus` related utilities (if any) to acknowledge new metadata.
3. Modify `app/(authenticated)/calendar/actions.ts`:
   - Adjust `updateEventStatus` signature to accept `resolutionType` and `resolutionNotes`.
   - When status resolves to completed/cancelled, set `resolved_at` and persist resolution metadata.
   - Ensure permission checks remain intact and error handling returns friendly messages.
4. Export updated action types for client components.

## Acceptance Criteria

- TypeScript compilation passes with the new optional fields.
- Server action persists resolution metadata without breaking existing callers.
- Existing permission gating logic still executes prior to database writes.

