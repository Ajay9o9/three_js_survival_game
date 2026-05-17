# KNOWN ISSUES

## Critical
- (none)

## High
- [ ] **No tool speed bonus** — Gathering uses bare hands speed for all resources. Axe on trees and pickaxe on rocks should be faster.
  - Severity: High
  - Impact: Tool system has no gameplay effect yet
  - Fix: Pass equipped tool to ResourceNode.startGather() and apply speed multiplier

- [ ] **No crafting system** — Items are defined but no recipe engine exists.
  - Severity: High
  - Impact: Cannot craft planks, stone blocks, or tools from raw materials
  - Fix: Implement Crafting.ts with recipe definitions and UI

## Medium
- [ ] **No interactive resource nodes on decorative trees** — Original decorative trees/rocks were replaced by interactive ones, but some may be missing.
  - Severity: Medium
  - Impact: World feels less populated than planned
  - Fix: Add more resource nodes in main.ts

- [ ] **No inventory UI screen** — Hotbar shows items but no full inventory management screen.
  - Severity: Medium
  - Impact: Cannot see all items or manage inventory beyond hotbar
  - Fix: Implement InventoryUI.ts with grid display and drag-drop

- [ ] **No building system** — Building items defined but no placement mechanic.
  - Severity: Medium
  - Impact: Cannot build shelters or structures
  - Fix: Implement Building.ts with grid snapping and preview

- [ ] **Player mesh uses BoxGeometry** — Character is a collection of boxes, not a proper model.
  - Severity: Medium
  - Impact: Visual quality is low, animations are basic
  - Fix: Replace with proper humanoid model or improve procedural mesh

## Low
- [ ] **Input system lacks key rebinding** — Keys are hardcoded in Input.ts.
  - Severity: Low
  - Fix: Add input configuration system with JSON config

- [ ] **No error boundaries** — A crash in any system halts the entire game.
  - Severity: Low
  - Fix: Wrap system updates in try/catch with error UI overlay

- [ ] **No unit tests** — No automated testing infrastructure.
  - Severity: Low
  - Fix: Add Vitest in Phase 5

- [ ] **No asset loading system** — All geometry is procedural. No support for external textures, models, or sounds.
  - Severity: Low
  - Fix: Implement GLTFLoader + TextureLoader pipeline in Phase 3+

## Architectural Concerns
- [ ] **Entity system is basic** — No component-based architecture. Will need refactoring for Phase 4+ enemy variety.
- [ ] **No object pooling** — Creating/destroying entities frequently will cause GC pressure.
- [ ] **No LOD system** — Distant objects render at full detail.
- [ ] **No camera collision** — Camera can clip through terrain.
- [ ] **Resource gathering uses manual timer** — Could be refactored into a state machine.
- [ ] **Save system doesn't save resource node states** — Resources reset on reload.
