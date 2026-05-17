# TASKS — Survival Game Project Tracker

## Phase 1: Foundation

### Completed
- [x] Read project instructions and requirements
- [x] Create PROJECT_PLAN.md
- [x] Create TASKS.md
- [x] Create CURRENT_STATE.md
- [x] Create KNOWN_ISSUES.md
- [x] Create CHANGELOG.md
- [x] Set up project scaffolding (package.json, tsconfig, vite config)
- [x] Install dependencies (three, @types/three, typescript, vite)
- [x] Create core engine: Engine.ts (game loop, lifecycle, subsystem registration)
- [x] Create core engine: Renderer.ts (Three.js scene, camera, renderer, resize handling)
- [x] Create core engine: Input.ts (keyboard WASD + shift/space, mouse tracking, pointer lock, action mapping)
- [x] Create core engine: Time.ts (delta time, fixed timestep, FPS tracking)
- [x] Create world: Terrain.ts (procedural heightmap terrain with vertex colors, bilinear interpolation)
- [x] Create world: Lighting.ts (ambient, directional sun with shadows, hemisphere light, day/night cycle)
- [x] Create world: Sky.ts (gradient sky dome with shader, day/night color transitions)
- [x] Create entities: Entity.ts (base entity with position/rotation/scale, bounding box, collision, movement helpers)
- [x] Create entities: Player.ts (third-person character with humanoid mesh, WASD movement, sprint, jump, camera follow, walking animation, health/hunger/stamina stats)
- [x] Create entities: EntityManager.ts (entity lifecycle management)
- [x] Create main.ts (bootstrap, wire systems, decorative trees/rocks, day/night cycle, debug overlay, pointer lock)
- [x] Create index.html (canvas container, loading screen, debug overlay, CSS styling)
- [x] TypeScript compilation passes with zero errors
- [x] Vite production build succeeds
- [x] Vite dev server runs and serves the game

## Phase 2: Survival Mechanics

### Completed
- [x] Item definitions system (ItemDefinition.ts) — 15+ items across 5 categories
- [x] Inventory system (Inventory.ts) — grid-based, item stacking, serialization
- [x] Resource node entities (ResourceNode.ts) — trees, rocks, ore, bushes with health bars
- [x] HUD system (HUD.ts) — health/hunger/stamina bars, hotbar, interaction prompt, gather progress
- [x] Save system (SaveSystem.ts) — localStorage persistence, auto-save
- [x] Resource gathering mechanics (E key) — near-resource detection, gathering progress
- [x] Interactive world — 20 trees, 15 rocks, 8 ore deposits, 12 berry bushes
- [x] Player inventory integration — addItem, removeItem, hasItem, getItemCount
- [x] Auto-save every 30 seconds
- [x] TypeScript compilation passes with zero errors
- [x] Vite production build succeeds (21 modules)

### In Progress
- [ ] Crafting system (recipes, UI, UI integration)
- [ ] Tool system with durability
- [ ] Building system (place/remove structures)
- [ ] Enemy AI and combat

### Blocked
- (none)

### Deferred
- [ ] Advanced terrain (heightmap-based with biomes)
- [ ] Procedural texture generation
- [ ] Water system
- [ ] Weather system

## Phase 3: Crafting & Building

### Not Started
- [ ] Crafting recipe definitions
- [ ] Crafting system (check ingredients, produce items)
- [ ] Crafting UI overlay
- [ ] Tool system (pickaxe, axe, sword) with durability
- [ ] Building system (place structures)
- [ ] Building grid snapping
- [ ] Building destruction

## Phase 4: Enemies & Combat

### Not Started
- [ ] Enemy base class
- [ ] Enemy AI (patrol, chase, attack states)
- [ ] Enemy spawning system
- [ ] Melee combat system
- [ ] Damage calculation
- [ ] Death & respawn
- [ ] Enemy drop tables

## Phase 5: Polish & Content

### Not Started
- [ ] Sound effects (footsteps, gathering, combat)
- [ ] Background music
- [ ] Particle effects (gathering, fire, blood)
- [ ] More terrain variety (hills, valleys)
- [ ] Main menu screen
- [ ] Settings menu (graphics, controls)
- [ ] Crosshair polish
- [ ] Minimap
- [ ] Performance optimization (LOD, instancing)

## Discovered Bugs
- (none — all TypeScript errors resolved)

## Technical Debt
- [ ] No asset loading system yet — all geometry is procedural
- [ ] No error boundaries — crashes halt the entire game
- [ ] Input system lacks key rebinding support
- [ ] No unit tests
- [ ] Player mesh uses BoxGeometry — will need proper model for Phase 4+
- [ ] No object pooling for entities
- [ ] Resource gathering uses bare hands only — no tool speed bonus yet

## Future Improvements
- [ ] Multiplayer support (networked entities)
- [ ] Mod support (JSON recipe/item definitions)
- [ ] Procedural world generation (chunks)
- [ ] Vehicle system
- [ ] Fishing/hunting mini-games
- [ ] Weather effects (rain, snow)
- [ ] NPC villagers
- [ ] Quest system
