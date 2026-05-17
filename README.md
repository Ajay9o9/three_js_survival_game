# Survival Game — Three.js + TypeScript

> A fully playable survival game built entirely by **Qwen3.6 35B** running through **ik_llama.cpp** on an **RTX 3060**, using the **pi coding agent** as the development harness.

## Purpose

This project was created to test the **strength and capability of Qwen3.6 35B** as a full-stack game development AI. Every line of code — from the Three.js engine core to the survival mechanics, inventory system, and HUD — was generated, iterated on, and debugged through this agent.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI Model** | Qwen3.6 35B |
| **Inference** | ik_llama.cpp |
| **Hardware** | NVIDIA RTX 3060 |
| **Development Agent** | pi coding agent |
| **Language** | TypeScript (strict mode) |
| **3D Engine** | Three.js 0.160.0 |
| **Build Tool** | Vite 5 |
| **Persistence** | localStorage |

## How to Run

```bash
# Install dependencies
npm install

# Start development server (hot-reload)
npm run dev

# Production build
npm run build

# Type check
npx tsc --noEmit
```

The dev server runs at **http://localhost:5173/**.

## Controls

| Key | Action |
|-----|--------|
| **WASD** | Move |
| **Shift** | Sprint (drains stamina) |
| **Space** | Jump |
| **E** | Gather nearby resource |
| **Click** | Lock mouse for camera control |
| **ESC** | Release mouse |

## Features

### ✅ Implemented (Phase 1–2)

- **Procedural terrain** — 200×200 world with heightmap, smooth slopes
- **Day/night cycle** — 5-minute cycle with dynamic sky, sun, and lighting
- **Third-person camera** — Mouse-look orbit around character
- **Survival stats** — Health, Hunger, Stamina with HUD bars
- **Interactive resources** — Trees (wood), rocks (stone), ore (minerals), berry bushes (food)
- **Gathering system** — Walk near resources, press E, watch progress bar, items fill inventory
- **Inventory** — 9×4 grid with stacking and hotbar
- **Auto-save** — Every 30 seconds to localStorage
- **20+ resource nodes** scattered across the world

### 🚧 Planned (Phase 3+)

- Crafting recipes & UI
- Tool system (pickaxe, axe, sword) with durability
- Building system with grid snapping
- Enemy AI & combat
- Sound effects & music
- Particle effects

## Project Structure

```
src/
├── core/       # Engine, Renderer, Input, Time
├── world/      # Terrain, Sky, Lighting
├── entities/   # Player, ResourceNode, EntityManager
├── systems/    # Inventory, ItemDefinition, SaveSystem
├── ui/         # HUD
└── utils/      # Logger
```

## Architecture

- **Modular TypeScript** with strict mode — clear subsystem separation
- **Fixed-timestep game loop** (60 Hz logic, variable rendering)
- **CSS overlay HUD** — UI is separate from Three.js rendering
- **Entity-component style** — base `Entity` class with subclassing
- **localStorage persistence** with versioning and auto-save

## Credits

- **AI Model**: Qwen3.6 35B — generated all code, logic, and architecture
- **Inference Engine**: ik_llama.cpp — local inference on RTX 3060
- **Development Agent**: pi coding agent — code generation, debugging, iteration
- **3D Library**: [Three.js](https://threejs.org/)
