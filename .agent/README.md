# .agents Directory

This directory contains planning documents and task breakdowns for development work.

## Example Structure

```
.agents/
├── README.md           # This file
├── plans/             # High-level planning documents
│   └── PLAN_sidebar_refactor.md
├── tasks/             # Individual task breakdowns
│   ├── TASK_01_store_updates.md
│   ├── TASK_02_collapsible_mode_update.md
│   ├── TASK_03_create_toggle_component.md
│   ├── TASK_04_create_header_component.md
│   ├── TASK_05_integrate_header_component.md
│   ├── TASK_06_css_refinements.md
│   ├── TASK_07_accessibility_enhancements.md
│   ├── TASK_08_mobile_responsiveness.md
│   └── TASK_09_comprehensive_testing.md
└── prompts/           # Developer handoff prompts
    └── PROMPT_sidebar_refactor_handoff.md
```

## Metadata Format

### Plan Files

Each plan file includes YAML frontmatter with metadata:

```yaml
---
plan_id: sidebar_refactor
title: Sidebar Layout Refactor Plan
created: 2025-10-06
status: Planning Complete
total_tasks: 9
completed_tasks: 0
estimated_hours: 5-6
priority: High
tags: [ui, sidebar, refactor, accessibility]
---
```

### Task Files

Each task file includes YAML frontmatter linking it to its parent plan:

```yaml
---
task_id: 01
plan_id: sidebar_refactor
plan_file: ../plans/PLAN_sidebar_refactor.md
title: Store Updates (Optional Enhancement)
phase: Phase 1
created: 2025-10-06
status: Ready
priority: Low
estimated_minutes: 15
dependencies: []
tags: [zustand, state-management, optional]
---
```

## Metadata Fields

### Plan Metadata

- **plan_id**: Unique identifier for the plan (snake_case)
- **title**: Human-readable plan title
- **created**: Date created (YYYY-MM-DD)
- **status**: Current status (Planning Complete, In Progress, Completed, etc.)
- **total_tasks**: Total number of tasks in the plan
- **completed_tasks**: Number of completed tasks
- **estimated_hours**: Estimated time to complete all tasks
- **priority**: High, Medium, or Low
- **tags**: Array of relevant tags

### Task Metadata

- **task_id**: Sequential task number (01, 02, etc.)
- **plan_id**: ID of the parent plan
- **plan_file**: Relative path to parent plan file
- **title**: Human-readable task title
- **phase**: Which phase of the plan this task belongs to
- **created**: Date created (YYYY-MM-DD)
- **status**: Current status (Ready, In Progress, Completed, Blocked, etc.)
- **priority**: High, Medium, or Low
- **estimated_minutes**: Estimated time to complete
- **dependencies**: Array of task files this depends on
- **tags**: Array of relevant tags

## Usage

### Finding Tasks for a Plan

```bash
# List all tasks for sidebar_refactor plan
grep -l "plan_id: sidebar_refactor" .agents/tasks/*.md

# Get task status
grep -A 1 "task_id:" .agents/tasks/TASK_01_store_updates.md | grep "status:"
```

### Parsing Metadata

The YAML frontmatter can be parsed with any YAML parser. Example in Python:

```python
import yaml

with open('.agents/tasks/TASK_01_store_updates.md', 'r') as f:
    content = f.read()
    # Extract frontmatter between --- delimiters
    if content.startswith('---'):
        _, frontmatter, body = content.split('---', 2)
        metadata = yaml.safe_load(frontmatter)
        print(f"Task: {metadata['title']}")
        print(f"Priority: {metadata['priority']}")
        print(f"Dependencies: {metadata['dependencies']}")
```

### Updating Task Status

To mark a task as complete, update the `status` field in the frontmatter:

```yaml
status: Completed # Changed from "Ready"
```

And update the parent plan's `completed_tasks`:

```yaml
completed_tasks: 1 # Increment from 0
```

## Current Plans

### Stats Page Implementation

**File**: [PLAN_stats_page_implementation.md](plans/PLAN_stats_page_implementation.md)
**Status**: Planning Complete
**Progress**: 0/6 tasks completed
**Estimated Time**: 4-5 hours

Implement a comprehensive statistics dashboard for the RefZone analytics page:

- Display overview metrics (matches, cards, goals, averages)
- Show recent matches in a table with key details
- Fetch data from Supabase with server actions
- Build reusable stats card components
- Handle loading, error, and empty states

**Tasks**:

1. [Create Types and Server Action](tasks/stats_page_implementation/TASK_01_stats_types_and_server_action.md) - 90 min
2. [Build StatsCard Component](tasks/stats_page_implementation/TASK_02_stats_card_component.md) - 30 min
3. [Build Stats Overview Section](tasks/stats_page_implementation/TASK_03_stats_overview_section.md) - 45 min
4. [Build Recent Matches Table](tasks/stats_page_implementation/TASK_04_recent_matches_table.md) - 45 min
5. [Integrate into Analytics Page](tasks/stats_page_implementation/TASK_05_page_integration.md) - 30 min
6. [Testing and Polish](tasks/stats_page_implementation/TASK_06_testing_and_polish.md) - 60 min

---

### ChatGPT-Inspired Layout Update

**File**: [PLAN_chatgpt_layout_update.md](plans/PLAN_chatgpt_layout_update.md)
**Status**: Planning Complete
**Progress**: 0/4 tasks completed
**Estimated Time**: 2-3 hours

Update the application layout to match the clean, borderless design from ChatGPT:

- Remove all borders from sidebar and top bar
- Move user menu to sidebar footer
- Move theme toggle to sidebar footer
- Clean, minimal appearance

**Tasks**:

1. [Remove Borders](tasks/TASK_01_remove_borders.md) - 20 min
2. [Create Sidebar User Menu](tasks/TASK_02_create_sidebar_user_menu.md) - 45 min
3. [Create Sidebar Theme Toggle](tasks/TASK_03_create_sidebar_theme_toggle.md) - 30 min
4. [Integrate Components](tasks/TASK_04_integrate_components.md) - 45 min

**Handoff Prompt**: [PROMPT_chatgpt_layout_handoff.md](prompts/PROMPT_chatgpt_layout_handoff.md)

---

### Sidebar Refactor Plan

**File**: [PLAN_sidebar_refactor.md](plans/PLAN_sidebar_refactor.md)
**Status**: Planning Complete
**Progress**: 0/9 tasks completed
**Estimated Time**: 5-6 hours

Refactor the sidebar component to implement a modern collapsible design with:

- Toggle button inside sidebar
- Mini-sidebar (icon mode) when collapsed
- Logo/toggle interchange on hover
- Tooltip support for collapsed icons

**Tasks**:

1. [Store Updates (Optional)](tasks/TASK_01_store_updates.md) - 15 min
2. [Update Collapsible Mode](tasks/TASK_02_collapsible_mode_update.md) - 15 min
3. [Create Toggle Component](tasks/TASK_03_create_toggle_component.md) - 30 min
4. [Create Header Component](tasks/TASK_04_create_header_component.md) - 60 min
5. [Integrate Header Component](tasks/TASK_05_integrate_header_component.md) - 30 min
6. [CSS Refinements](tasks/TASK_06_css_refinements.md) - 30 min
7. [Accessibility Enhancements](tasks/TASK_07_accessibility_enhancements.md) - 45 min
8. [Mobile Responsiveness](tasks/TASK_08_mobile_responsiveness.md) - 30 min
9. [Comprehensive Testing](tasks/TASK_09_comprehensive_testing.md) - 60 min

**Handoff Prompt**: [PROMPT_sidebar_refactor_handoff.md](prompts/PROMPT_sidebar_refactor_handoff.md)

- Comprehensive onboarding guide for new developers
- Step-by-step implementation workflow
- Technical requirements and constraints
- Code examples and testing strategies

## Developer Handoff Prompts

The `prompts/` directory contains comprehensive handoff documents for bringing new developers onto a plan.

### What's in a Handoff Prompt?

- **Project Context**: Overview of the codebase and tech stack
- **Mission Statement**: Clear objective for what needs to be built
- **Getting Started Guide**: Step-by-step onboarding process
- **Architecture Overview**: Key files and current implementation
- **Task Sequence**: Recommended order of implementation
- **Technical Requirements**: Must-use technologies and constraints
- **Code Examples**: References to implementation details in tasks
- **Development Workflow**: How to pick, implement, and complete tasks
- **Testing Strategy**: What and how to test
- **Common Pitfalls**: What to avoid and best practices
- **Success Criteria**: How to know when you're done

### Using a Handoff Prompt

```bash
# Give this to a new developer joining the project
cat .agents/prompts/PROMPT_sidebar_refactor_handoff.md

# Or share the file directly
# It contains everything needed to start working
```

## Benefits of This Structure

1. **Traceability**: Every task links back to its parent plan
2. **Parseable**: YAML frontmatter can be processed programmatically
3. **Human-Readable**: Markdown format is easy to read and edit
4. **Git-Friendly**: Text files work well with version control
5. **Searchable**: Can grep/search across all metadata
6. **Scalable**: Easy to add new plans and tasks
7. **Self-Documenting**: Metadata provides context without external tools

## Future Enhancements

Potential additions to this structure:

- Automated task status tracking
- Progress dashboard generation
- Dependency graph visualization
- Time tracking integration
- Automated manifest generation
- Task assignment tracking
