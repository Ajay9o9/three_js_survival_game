# CHANGELOG

## Session 1 — 2026-05-16 — Project Initialization & Core Engine

### Systems Added
- Project scaffolding: package.json, tsconfig.json, vite.config.ts
- Core engine: Engine.ts (game loop with fixed timestep + variable render, subsystem registration, state management)
- Core engine: Renderer.ts (Three.js scene, perspective camera, WebGL renderer with PCF soft shadows, ACES tone mapping, resize handling, fog/sky updates)
- Core engine: Input.ts (keyboard WASD + shift/space/E/I/C/R/P/Escape, mouse movement + buttons, pointer lock, action-based input mapping, frame state cleanup)
- Core engine: Time.ts (delta time, fixed timestep accumulator, FPS tracking, formatted time)
- World: Terrain.ts (200x200 procedural terrain with multi-octave heightmap, vertex colors, bilinear height interpolation, world bounds clamping)
- World: Lighting.ts (ambient, directional sun with 2048x2048 shadow map, hemisphere light, day/night cycle with sun arc, dawn/dusk color shifts)
- World: Sky.ts (shader-based gradient sky dome with day/night color interpolation)
- Entities: Entity.ts (base entity with position/rotation/scale, bounding box collision, movement helpers, distance calculations)
- Entities: Player.ts (third-person humanoid character, WASD movement relative to camera yaw, sprint, jump, terrain-following, smooth third-person camera, walking animation, health/hunger/stamina stats)
- Entities: EntityManager.ts (entity CRUD, tagging, nearby entity search, closest entity finder)
- Bootstrap: main.ts (wires all systems, 40 decorative trees, 25 rocks, day/night cycle, debug overlay, pointer lock)
- Entry: index.html (loading screen with progress bar, debug overlay, styled canvas)

### Files Changed
- Created: package.json, tsconfig.json, vite.config.ts
- Created: src/main.ts, src/core/Engine.ts, src/core/Renderer.ts, src/core/Input.ts, src/core/Time.ts
- Created: src/world/Terrain.ts, src/world/Lighting.ts, src/world/Sky.ts
- Created: src/entities/Entity.ts, src/entities/Player.ts, src/entities/EntityManager.ts
- Created: src/utils/Logger.ts, index.html
- Created: PROJECT_PLAN.md, TASKS.md, CURRENT_STATE.md, KNOWN_ISSUES.md, CHANGELOG.md

### Bug Fixes
- Fixed `isPointerLocked` duplicate identifier in Input.ts (renamed property to `pointerLocked`)
- Fixed `distanceSquared` → `distanceToSquared` in Entity.ts and EntityManager.ts (Three.js API)
- Fixed `intersectsBox` argument count in Entity.ts (removed margin parameter)
- Fixed Three.js type compatibility for Fog/Color in Renderer.ts (added instanceof checks)
- Fixed Player config spread order (fullConfig defined before super() call)
- Fixed Player mesh assignment (used type assertion for read-only mesh property)
- Fixed Lighting.updateDayNight() missing renderer parameter (added optional renderer param)
- Fixed all `any` type issues in Entity.ts, Renderer.ts, Player.ts

### Architecture Changes
- Established modular TypeScript architecture with clear subsystem separation
- Three.js loaded via npm dependency with @types/three for type safety
- Vite as build tool for TypeScript compilation and HMR dev server
- Entity-component style with base Entity class
- Fixed timestep physics with variable rendering

## Session 2 — 2026-05-16 — Phase 1 Completion & Verification

### Systems Verified
- TypeScript compilation: zero errors across all 16 modules
- Vite production build: succeeds, outputs ~489KB JS bundle
- Vite dev server: runs on port 5173, serves game correctly

## Session 3 — 2026-05-16 — Phase 2: Survival Mechanics

### Systems Added
- **Item Definitions** (ItemDefinition.ts): 15+ items across 5 categories (resource, food, tool, material, building) with tool types, resource types, food values, durability, build costs
- **Inventory System** (Inventory.ts): 9x4 grid inventory, item stacking, add/remove/find operations, serialization/deserialization, change callbacks, slot swap
- **Resource Nodes** (ResourceNode.ts): Interactive trees (wood), rocks (stone), ore deposits (ore), berry bushes (berries) with health bars, highlight rings, tool requirements, drop tables, gathering progress
- **HUD System** (HUD.ts): Health/hunger/stamina bars with icons and values, 9-slot hotbar with item icons and counts, interaction prompt, gather progress bar, slot highlighting
- **Save System** (SaveSystem.ts): localStorage persistence, auto-save every 30s, save/load player stats/inventory/position/world state, save info retrieval
- **Resource Gathering** (main.ts): E key to gather nearby resources, 5-unit interaction radius, progress bar, item drops to inventory, resource health depletion
- **Player Integration**: Inventory added to Player entity, addItem/removeItem/hasItem/getItemCount methods, inventory save/load integration

### Files Changed
- Created: src/systems/ItemDefinition.ts
- Created: src/systems/Inventory.ts
- Created: src/systems/SaveSystem.ts
- Created: src/entities/ResourceNode.ts
- Created: src/ui/HUD.ts
- Modified: src/entities/Player.ts (added inventory integration)
- Modified: src/main.ts (rewrote to wire Phase 2 systems, 55 resource nodes, gathering, HUD, auto-save)

### Bug Fixes
- Fixed ResourceNode material type casting (MeshBasicMaterial instanceof checks for color/opacity)
- Fixed SaveSystem world type (made resourceNodes optional)
- Fixed HUD isVisible duplicate identifier (renamed method to getVisible)
- Fixed main.ts auto-save throttling (removed engine private property access)
- Fixed ResourceNode gather API (added getGatherDuration() and getToolRequired() public methods)

### Architecture Changes
- Added systems/ category for game logic (Inventory, SaveSystem, ItemDefinition)
- Added ui/ category for HUD (separate from Three.js rendering)
- Resource nodes now use Entity base class with proper lifecycle
- Inventory system is independent and serializable
- Save system versioned (v1) with migration support ready

### Breaking Changes
- None — all changes are additive

## Session 4 — 2026-05-18 — Phase 3: Crafting & Building

### Critical Bug Fixes (Pre-Phase 3)
- Fixed Entity constructor crash (`Cannot read properties of undefined reading position`)
  — Moved `createMesh()` to accept config parameter instead of using `this` before `super()`
- Fixed WASD movement axes swapped
  — Corrected camera-relative rotation formula to match camera coordinate system
- Fixed gathering not working (tool check blocked all gathers)
  — Removed hard tool requirement, now allows gathering without tools
- Fixed gather duration hardcoded to 1.0s
  — Now calculated as `1 / gatherSpeed` (trees=0.33s, rocks=0.33s, ore=0.25s, bushes=1.0s)

### Systems Added
- **Crafting System** (Crafting.ts): 11 recipes across 3 categories (Materials, Tools, Building). Recipe registry with ingredient checking, ingredient consumption, inventory space validation, result production
- **Tool System** (ToolManager.ts): Tool equipping from hotbar (keys 1-9), speed multiplier applied during gathering, durability tracking with wear per gather tick, tool break on zero durability, save/load durability to inventory metadata
- **Building System** (Building.ts): 1m grid snapping, placement preview (green=valid/red=invalid), 45° rotation (R key), click to place, building removal with 50% ingredient refund, visual meshes with correct scale per type (walls=2 tall, floors=thin)
- **Inventory UI** (InventoryUI.ts): Full 9x4 grid overlay (I key), arrow key navigation, click to select, item emoji icons, slot count display, inventory change callbacks

### Systems Modified
- **Inventory.ts**: Added `metadata` field to `InventorySlot`, added `getSlotWithItem()`, `getAvailableSpace()`, `emitChange()` methods
- **ResourceNode.ts**: Updated `startGather()` to accept tool type and durability wear amount, updated `getGatherDuration()` to accept speed multiplier
- **Player.ts**: Fixed `characterGroup` initialization order (created before `super()` call)
- **main.ts**: Integrated all Phase 3 systems, added key bindings (I/Q/R/1-9/click), building preview update loop, tool durability wear during gathering

### Files Created
- src/systems/Crafting.ts
- src/systems/ToolManager.ts
- src/systems/Building.ts
- src/ui/InventoryUI.ts
- README.md
- .gitignore

### Files Modified
- src/systems/Inventory.ts
- src/entities/Entity.ts
- src/entities/Player.ts
- src/entities/ResourceNode.ts
- src/main.ts
- CURRENT_STATE.md
- CHANGELOG.md

### Controls Added
| Key | Action |
|-----|--------|
| I | Toggle inventory screen |
| Q | Toggle building preview |
| R | Rotate building (during preview) |
| Click | Place building (during preview) |
| 1-9 | Equip/unequip tool from hotbar |
