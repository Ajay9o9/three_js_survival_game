# Persistent Task Tracking & Checkpoint System

The agent must maintain persistent progress tracking throughout the project.

Create and continuously update the following files:

* PROJECT_PLAN.md
* TASKS.md
* CURRENT_STATE.md
* KNOWN_ISSUES.md
* CHANGELOG.md

These files are critical and must remain synchronized with the actual project state.

---

# TASKS.md Requirements

TASKS.md acts as the main project tracker.

It must contain:

* completed tasks
* active tasks
* blocked tasks
* deferred tasks
* discovered bugs
* technical debt
* future improvements

Use checkbox/task style formatting.

Example:

* [x] Implement renderer initialization
* [x] Add third-person camera
* [ ] Implement inventory persistence
* [ ] Fix enemy collision jitter
* [ ] Optimize particle system allocations

The agent must:

* update task states continuously
* avoid forgetting unfinished work
* avoid marking incomplete work as done
* create subtasks when complexity grows
* add newly discovered issues/tasks automatically

---

# PROJECT_PLAN.md Requirements

PROJECT_PLAN.md should contain:

* high-level architecture plan
* development phases
* subsystem dependencies
* implementation order
* optimization strategy
* future scalability considerations

This document should evolve as the project grows.

---

# CURRENT_STATE.md Requirements

CURRENT_STATE.md should summarize:

* what currently works
* broken systems
* partially implemented systems
* current blockers
* current architecture status
* latest debugging state
* recent changes affecting stability

This file should help resume work after context loss.

---

# KNOWN_ISSUES.md Requirements

Track:

* runtime bugs
* performance issues
* unstable systems
* edge cases not fully solved
* browser/device incompatibilities
* architectural concerns
* technical debt

Each issue should include:

* description
* severity
* suspected cause
* reproduction steps if known
* possible fixes

---

# CHANGELOG.md Requirements

Maintain a chronological changelog.

Each entry should include:

* date/session identifier
* systems added
* files changed
* bug fixes
* architecture changes
* breaking changes

Avoid vague entries like:

* “updated stuff”
* “fixed bugs”

Prefer:

* “Refactored inventory serialization to avoid circular save references”
* “Fixed physics timestep instability causing projectile tunneling”

---

# Checkpointing Behavior

At major milestones, create checkpoints.

A checkpoint should summarize:

* completed systems
* current architecture
* unresolved issues
* performance concerns
* next priorities

Checkpoint summaries should be concise but information-dense.

The agent should create checkpoints:

* after major subsystems
* before large refactors
* before context becomes too large
* after major debugging sessions
* before risky architectural changes

---

# Context Recovery Behavior

If conversation context becomes fragmented or partially lost:

The agent should:

* reconstruct project state from checkpoint/task files
* prioritize consistency with existing architecture
* avoid re-implementing already completed systems
* avoid conflicting rewrites

Persistent project files are the primary source of truth.

---

# Planning & Execution Expectations

The agent should behave like a long-running engineering process, not a one-shot generator.

Expected workflow:

1. Analyze requirements
2. Update planning/task files
3. Implement incrementally
4. Verify functionality
5. Update checkpoints/state
6. Continue iteration

The agent should continuously reason about:

* project health
* technical debt
* maintainability
* scalability
* debugging complexity
* performance impact
* future extensibility
