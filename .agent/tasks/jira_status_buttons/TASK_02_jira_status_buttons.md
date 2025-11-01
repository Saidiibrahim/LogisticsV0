---
task_id: 02
plan_id: PLAN_jira_status_buttons
plan_file: ../../plans/jira_status_buttons/PLAN_jira_status_buttons.md
title: Implement Jira-style status controls
phase: Phase 2 - UI/UX
---

## Goal

Replace the existing quick status controls in `EventDetailsDialog` with Jira-inspired buttons, loading feedback, and a resolution dialog.

## Steps

1. Import and render `StatusBadge` for the primary status indicator in the dialog header.
2. Add icons and color accents to the status buttons (progress, cancel, resolve).
3. Manage local state for:
   - `isUpdatingStatus`
   - `pendingStatus`
   - `showResolutionDialog`
   - `resolutionType` and `resolutionNotes`
4. Implement handlers:
   - Immediate update for scheduled/in-progress transitions.
   - Dialog-driven update for completed/cancelled transitions.
5. Wire the resolution dialog inputs (select + textarea) and confirm action to the new server action signature.
6. Disable buttons while updates are running and show loading indicators.

## Acceptance Criteria

- Buttons convey Jira-style color and icon semantics.
- Completed/cancelled paths require confirmation via dialog before persisting.
- Loading state prevents duplicate submissions.
- Permission-based visibility still functions.

