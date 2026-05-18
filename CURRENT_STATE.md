# CURRENT STATE — Project Status

## What Currently Works
- **Phase 1 Foundation** (complete):
  - Core engine: Engine, Renderer, Input, Time
  - World: Terrain (procedural heightmap), Lighting (day/night), Sky (gradient dome)
  - Entities: Entity base class, Player (third-person with stats), EntityManager
  - Bootstrap: main.ts, index.html with loading screen

- **Phase 2 Survival Mechanics** (complete):
  - **Item Definitions** (ItemDefinition.ts): 15+ items across 5 categories
  - **Inventory System** (Inventory.ts): 9x4 grid, item stacking, add/remove/find operations, serialization/deserialization, change callbacks
  - **Resource Nodes** (ResourceNode.ts): Interactive trees, rocks, ore, bushes with health bars, highlight rings, tool requirements
  - **HUD System** (HUD.ts): Health/hunger/stamina bars, 9-slot hotbar, interaction prompts, gather progress bar
  - **Save System** (SaveSystem.ts): localStorage persistence, auto-save every 30s
  - **Resource Gathering**: E key to gather nearby resources, progress bar, item drops to inventory

- **Phase 3 Crafting & Building** (COMPLETE):
  - **Crafting System** (Crafting.ts): 11 recipes across Materials, Tools, Building categories. Ingredient checking, production, inventory integration
  - **Tool System** (ToolManager.ts): Tool equipping from hotbar (1-9 keys), speed bonuses applied during gathering, durability tracking and wear, tool break on zero durability
  - **Building System** (Building.ts): Grid snapping (1m grid), placement preview (green=valid, red=invalid), 45° rotation (R key), click to place, building removal with 50% refund
  - **Inventory UI** (InventoryUI.ts): Full 9x4 grid screen (I key), arrow key navigation, click to select, item emojis, slot count display
  - **Building Controls**: Q to toggle building preview, R to rotate, Click to place, ESC to cancel

## Current Architecture Status
- 25 TypeScript modules across 6 subsystem categories
- Three.js 0.160.0 via npm with @types/three
- Vite build: ~560KB bundle
- Modular architecture with clear separation: core, world, entities, systems, ui, utils
- Fixed timestep physics with variable rendering

## New Systems Added in Phase 3
| System | File | Key | Function |
|--------|------|-----|----------|
| CraftingSystem | src/systems/Crafting.ts | — | 11 recipes, ingredient consumption |
| ToolManager | src/systems/ToolManager.ts | 1-9 | Equip/unequip tools, durability tracking |
| BuildingSystem | src/systems/Building.ts | Q/R/Click | Grid placement, preview, removal |
| InventoryUI | src/ui/InventoryUI.ts | I | Full grid screen with navigation |

## Controls
| Key | Action |
|-----|--------|
| WASD | Move |
| Shift | Sprint |
| Space | Jump |
| E | Gather nearby resource |
| I | Toggle inventory screen |
| Q | Toggle building preview |
| R | Rotate building (during preview) |
| Click (during preview) | Place building |
| 1-9 | Equip/unequip tool from hotbar |
| ESC | Release mouse / close UI |

## Known Issues
- Building meshes don't persist across page reload (need to recreate from save data)
- Tool durability save/load not fully integrated with SaveSystem yet
- No sound effects
