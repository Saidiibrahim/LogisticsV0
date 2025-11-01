---
task_id: 01
plan_id: PLAN_nextjs-upgrade-16
plan_file: ../../plans/nextjs-upgrade-16/PLAN_nextjs-upgrade-16.md
title: Prep workspace and trigger upgrade automation
phase: Phase 1 - Upgrade Execution
---

- Confirm dependency baselines (`next`, `react`, `typescript`) and review `next.config.mjs` for experimental flags.
- Ensure pnpm lockfile is up to date; stash notes on any local changes that could block the codemod.
- Invoke the Next Devtools `upgrade_nextjs_16` workflow and capture its output and generated diffs.
