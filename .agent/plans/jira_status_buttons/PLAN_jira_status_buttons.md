# PLAN_jira_status_buttons

**Feature:** Jira-Style Status Update UX  
**Priority:** High  
**Estimated Duration:** 1 day  
**Started:** 2025-10-28

---

## Purpose / Big Picture

Give dispatchers and drivers a clear, Jira-inspired flow for updating calendar event statuses. Users should immediately see color-coded states, inline actions, and contextual prompts when completing or cancelling an event. Success and error feedback happens in-place without leaving the dialog.

**User-Visible Behavior:**
- Status chip displays an icon and color that matches the status.
- Inline buttons let permitted users start progress, cancel, or resolve items with loading feedback.
- Completing or cancelling asks for a resolution type and optional notes before persisting.

---

## Surprises & Discoveries

- **Observation:** `updateEventStatus` server action only accepts the new status string.  
  **Evidence:** `app/(authenticated)/calendar/actions.ts` line 270 updates only the `status` column.  
  **Impact:** Need to extend the action to accept resolution metadata for completed/cancelled states.

- **Observation:** UI already exposes permission checks via `useUser().hasPermission()`.  
  **Evidence:** `components/calendar/event-details-dialog.tsx` calculates `showStatusControls`, `canManageAnyStatus`, and `canManageOwnStatus`.  
  **Impact:** We can reuse these checks so the new buttons remain permission-aware without rework.

---

## Decision Log

- **Decision:** Persist resolution metadata alongside status updates.  
  **Rationale:** Enables future audit trails and mirrors Jira’s completion workflow.  
  **Date/Author:** 2025-10-28 / Codex Agent

- **Decision:** Implement resolution capture via existing Shadcn `AlertDialog`.  
  **Rationale:** Keeps UI consistent, avoids adding new dependencies.  
  **Date/Author:** 2025-10-28 / Codex Agent

---

## Outcomes & Retrospective

_Fill in after implementation_

---

## Context and Orientation

- `components/calendar/event-details-dialog.tsx` renders the calendar drawer, including quick status buttons that currently lack icons, colors, or resolution prompts.
- `components/ui/status-badge.tsx` provides a badge component but is not yet used inside the dialog header. It expects `EventStatus` from `lib/types/calendar`.
- `app/(authenticated)/calendar/actions.ts` exports `updateEventStatus(eventId, newStatus)` with permission enforcement but no resolution handling.
- `lib/types/calendar.ts` defines `EventStatus` and `CalendarEvent` but lacks resolution-related properties.
- Toast utilities live in `components/ui/use-toast.tsx` (Shadcn pattern) and should deliver success / error feedback.

---

## Plan of Work

1. Extend the domain types and server action contract so status updates can carry `resolutionType`, `resolutionNotes`, and automatically set `resolved_at` for terminal statuses.
2. Refactor `EventDetailsDialog`:
   - Replace the ad-hoc badge with `StatusBadge`.
   - Swap the basic buttons for Jira-style actions with icons, color accents, and loading states.
   - Introduce local state to control resolution dialogs and pending UI.
   - Trigger toasts on success/failure and refresh the parent via existing close handlers.
3. Build the resolution dialog UI with select + textarea inputs, wiring it to the new action payload.
4. Ensure permission checks still gate the controls and that cancel/complete actions open the dialog.
5. Verify types compile, adjust imports, and run lint/test surfaces as available.

---

## Concrete Steps

Each concrete edit has a dedicated task document stored under `.agent/tasks/jira_status_buttons/` and references this plan via frontmatter.

---

## Progress

- [x] (TASK_01_jira_status_buttons.md) Audit existing flow and update domain types/server action signature. *(2025-10-28)*
- [x] (TASK_02_jira_status_buttons.md) Rebuild event details status controls with Jira-style actions and resolution dialog. *(2025-10-28)*
- [x] (TASK_03_jira_status_buttons.md) Validate UX (toasts, disabled states) and document testing. *(2025-10-28 — pnpm type-check, pnpm lint)*

---

## Testing Approach

- Manual: Update an event from scheduled → in-progress, then to completed; verify toasts, loading states, and dialog UX.
- Manual: Attempt cancellation and ensure prompts/notes persist only when confirmed.
- Regression: Run `pnpm lint` and `pnpm test` if time allows; otherwise spot-check TypeScript errors via `pnpm type-check`.

---

## Constraints & Considerations

- Database schema must store `resolution_type`, `resolution_notes`, and `resolved_at`. Confirm columns exist or adjust model expectations.
- Maintain accessibility: buttons remain keyboard accessible, dialog traps focus.
- Follow existing permission gating logic; avoid exposing actions to unauthorized roles.
