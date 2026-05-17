# PROJECT PLAN — Three.js Survival Game

## High-Level Architecture

```
gamefolder/
├── index.html              # Entry point
├── assets/                 # Static assets (textures, models, sounds)
├── src/
│   ├── main.ts             # Application bootstrap
│   ├── core/               # Core engine systems
│   │   ├── Engine.ts       # Main game engine loop
│   │   ├── Renderer.ts     # Three.js renderer setup
│   │   ├── Input.ts        # Keyboard/mouse input handling
│   │   └── Time.ts         # Delta time & game time management
│   ├── world/              # World & environment
│   │   ├── Terrain.ts      # Procedural terrain generation
│   │   ├── Sky.ts          # Skybox & day/night cycle
│   │   └── Lighting.ts     # Dynamic lighting setup
│   ├── entities/           # Game entities
│   │   ├── Entity.ts       # Base entity class
│   │   ├── Player.ts       # Player character (third-person)
│   │   ├── Enemy.ts        # Enemy AI
│   │   └── EntityManager.ts # Entity lifecycle management
│   ├── systems/            # Game systems
│   │   ├── Inventory.ts    # Inventory & item management
│   │   ├── Crafting.ts     # Crafting recipes & system
│   │   ├── Health.ts       # Health/hunger/stamina
│   │   ├── DayNight.ts     # Day/night cycle logic
│   │   └── SaveSystem.ts   # Save/load persistence
│   ├── ui/                 # User interface
│   │   ├── HUD.ts          # Heads-up display
│   │   ├── InventoryUI.ts  # Inventory screen
│   │   └── CraftingUI.ts   # Crafting screen
│   └── utils/              # Utilities
│       ├── MathUtils.ts    # Vector/geometry helpers
│       └── Logger.ts       # Debug logging
├── package.json
├── tsconfig.json
├── vite.config.ts
└── ...
```

## Development Phases

### Phase 1: Foundation (COMPLETE)
- [x] Project scaffolding (package.json, tsconfig, vite config)
- [x] Core engine (renderer, game loop, input, time)
- [x] Basic 3D scene with terrain
- [x] Player character with third-person camera
- [x] Basic movement & collision (terrain-following, gravity, jump)
- [x] Decorative world (trees, rocks)
- [x] Day/night cycle
- [x] Debug overlay
- [x] TypeScript compilation passes
- [x] Vite build succeeds

### Phase 2: Survival Mechanics (COMPLETE)
- [x] Item definitions (15+ items, 5 categories)
- [x] Inventory system (9x4 grid, stacking, serialization)
- [x] Resource nodes (trees, rocks, ore, bushes — interactive)
- [x] HUD system (stat bars, hotbar, prompts, progress)
- [x] Save system (localStorage, auto-save every 30s)
- [x] Resource gathering mechanics (E key, progress, drops)
- [x] Player inventory integration

### Phase 3: Crafting & Building
- [ ] Crafting recipe system
- [ ] Crafting UI
- [ ] Basic building (place/remove structures)
- [ ] Tool system (pickaxe, axe, sword)

### Phase 4: Enemies & Combat
- [ ] Enemy AI (patrol, chase, attack)
- [ ] Combat system (melee attacks)
- [ ] Damage & death
- [ ] Enemy spawning (day/night dependent)

### Phase 5: Polish & Content
- [x] Save/load system (Phase 2)
- [ ] Sound effects & music
- [ ] Particle effects
- [ ] More terrain variety
- [ ] UI polish & menus
- [ ] Performance optimization (LOD, instancing)

## Subsystem Dependencies

```
Engine → Renderer, Input, Time
  ↓
World → Terrain, Sky, Lighting
  ↓
Entities → Player, Enemy, EntityManager
  ↓
Systems → Inventory, Crafting, Health, DayNight, SaveSystem
  ↓
UI → HUD, InventoryUI, CraftingUI
```

## Implementation Order

1. Engine core (renderer, loop, input)
2. World (terrain, sky, lighting)
3. Player (movement, camera, collision)
4. Survival stats (health, hunger, stamina)
5. Resources & inventory
6. Crafting system
7. Enemies & combat
8. Building system
9. Save/load
10. Polish

## Optimization Strategy

- Use instanced meshes for repeated geometry (trees, rocks)
- Implement object pooling for projectiles/particles
- Frustum culling for entities
- LOD system for terrain at distance
- Lazy-load assets
- Use requestAnimationFrame with delta-time physics

## Scalability Considerations

- ECS-ready architecture (entities/components pattern)
- Plugin-friendly subsystem design
- Config-driven recipes, items, enemies
- Asset pipeline ready for external models/textures
- Multiplayer-ready networking hooks (future)
