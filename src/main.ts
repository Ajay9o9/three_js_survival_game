/**
 * Main application entry point.
 * Wires all systems together and bootstraps the game.
 */
import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { Terrain } from './world/Terrain.js';
import { Lighting } from './world/Lighting.js';
import { Sky } from './world/Sky.js';
import { Player } from './entities/Player.js';
import { EntityManager } from './entities/EntityManager.js';
import { ResourceNode } from './entities/ResourceNode.js';
import { Inventory } from './systems/Inventory.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { CraftingSystem } from './systems/Crafting.js';
import { ToolManager } from './systems/ToolManager.js';
import { BuildingSystem } from './systems/Building.js';
import { InventoryUI } from './ui/InventoryUI.js';
import { HUD } from './ui/HUD.js';
import { ToolType, ResourceNode as ResourceType, getItemDefinition } from './systems/ItemDefinition.js';
import { Logger } from './utils/Logger.js';

// DOM elements
const debugOverlay = document.getElementById('debug-overlay')!;
const loadingScreen = document.getElementById('loading-screen')!;
const loadingBar = document.getElementById('loading-bar')!;

/**
 * Initialize the game.
 */
function init(): void {
  Logger.info('Main', '=== SURVIVAL GAME INITIALIZING ===');

  loadingBar.style.width = '10%';

  // Create engine
  const container = document.getElementById('game-container')!;
  const engine = new Engine(container, {
    fixedTimestep: 1 / 60,
    maxFrameTime: 0.1,
  });

  loadingBar.style.width = '20%';

  // Get subsystems
  const renderer = engine.getRenderer();
  const input = engine.getInput();
  const time = engine.getTime();

  // Create terrain
  loadingBar.style.width = '30%';
  const terrain = new Terrain({
    worldSize: 200,
    gridSize: 100,
    tileSize: 2,
    heightAmplitude: 3,
    seed: 42,
  });
  renderer.addObject(terrain.getMesh());

  // Create lighting
  loadingBar.style.width = '40%';
  const lighting = new Lighting();
  lighting.addToRenderer(renderer);

  // Create sky
  loadingBar.style.width = '45%';
  const sky = new Sky(renderer);

  // Create entity manager
  loadingBar.style.width = '50%';
  const entityManager = new EntityManager(renderer);

  // Create inventory
  loadingBar.style.width = '55%';
  const inventory = new Inventory({ width: 9, height: 4 }, 'player');

  // Create save system
  const saveSystem = new SaveSystem();

  // Create tool manager
  const toolManager = new ToolManager();

  // Create crafting system
  const craftingSystem = new CraftingSystem();

  // Create HUD (needed by InventoryUI)
  const hud = new HUD(container);

  // Create building system
  const buildingSystem = new BuildingSystem();

  // Create inventory UI
  const inventoryUI = new InventoryUI(inventory, hud);

  // Create player with inventory
  loadingBar.style.width = '60%';
  const player = new Player(
    {
      position: { x: 0, y: 0, z: 0 },
      moveSpeed: 8,
      sprintMultiplier: 1.8,
      jumpForce: 8,
      gravity: -20,
      cameraDistance: 8,
      cameraHeight: 4,
      cameraSmoothness: 8,
      mouseSensitivity: 0.002,
    },
    input,
    time,
    terrain,
    inventory
  );
  entityManager.create(player);
  entityManager.tag(player, 'player');

  // Create resource nodes (interactive)
  loadingBar.style.width = '70%';
  const resourceNodes: ResourceNode[] = [];
  const rand = seededRandom(12345);

  // Create trees
  for (let i = 0; i < 20; i++) {
    const x = (rand() - 0.5) * terrain.getSize() * 0.7;
    const z = (rand() - 0.5) * terrain.getSize() * 0.7;
    if (Math.sqrt(x * x + z * z) < 8) continue;

    const height = terrain.getHeight(x, z);
    const node = new ResourceNode({
      name: `tree_${i}`,
      resourceType: ResourceType.TREE,
      resourceAmount: 3,
      health: 10,
      maxHealth: 10,
      toolRequired: ToolType.AXE,
      gatherSpeed: 3,
      dropItemIds: ['wood'],
      dropAmounts: [2 + Math.floor(rand() * 2)],
      position: { x, y: height, z },
      scale: { x: 1, y: 1, z: 1 },
    }, inventory);

    entityManager.create(node);
    entityManager.tag(node, 'resource');
    entityManager.tag(node, 'tree');
    resourceNodes.push(node);
  }

  // Create rocks
  for (let i = 0; i < 15; i++) {
    const x = (rand() - 0.5) * terrain.getSize() * 0.7;
    const z = (rand() - 0.5) * terrain.getSize() * 0.7;
    if (Math.sqrt(x * x + z * z) < 8) continue;

    const height = terrain.getHeight(x, z);
    const node = new ResourceNode({
      name: `rock_${i}`,
      resourceType: ResourceType.ROCK,
      resourceAmount: 2,
      health: 15,
      maxHealth: 15,
      toolRequired: ToolType.PICKAXE,
      gatherSpeed: 3,
      dropItemIds: ['stone'],
      dropAmounts: [1 + Math.floor(rand() * 2)],
      position: { x, y: height, z },
      scale: { x: 1, y: 1, z: 1 },
    }, inventory);

    entityManager.create(node);
    entityManager.tag(node, 'resource');
    entityManager.tag(node, 'rock');
    resourceNodes.push(node);
  }

  // Create ore deposits
  for (let i = 0; i < 8; i++) {
    const x = (rand() - 0.5) * terrain.getSize() * 0.6;
    const z = (rand() - 0.5) * terrain.getSize() * 0.6;
    if (Math.sqrt(x * x + z * z) < 10) continue;

    const height = terrain.getHeight(x, z);
    const node = new ResourceNode({
      name: `ore_${i}`,
      resourceType: ResourceType.ORE,
      resourceAmount: 2,
      health: 20,
      maxHealth: 20,
      toolRequired: ToolType.PICKAXE,
      gatherSpeed: 4,
      dropItemIds: ['ore'],
      dropAmounts: [1 + Math.floor(rand() * 2)],
      position: { x, y: height, z },
      scale: { x: 1, y: 1, z: 1 },
    }, inventory);

    entityManager.create(node);
    entityManager.tag(node, 'resource');
    entityManager.tag(node, 'ore');
    resourceNodes.push(node);
  }

  // Create berry bushes
  for (let i = 0; i < 12; i++) {
    const x = (rand() - 0.5) * terrain.getSize() * 0.7;
    const z = (rand() - 0.5) * terrain.getSize() * 0.7;
    if (Math.sqrt(x * x + z * z) < 6) continue;

    const height = terrain.getHeight(x, z);
    const node = new ResourceNode({
      name: `bush_${i}`,
      resourceType: ResourceType.BUSH,
      resourceAmount: 5,
      health: 3,
      maxHealth: 3,
      toolRequired: ToolType.NONE,
      gatherSpeed: 1,
      dropItemIds: ['berries'],
      dropAmounts: [1 + Math.floor(rand() * 2)],
      position: { x, y: height, z },
      scale: { x: 1, y: 1, z: 1 },
    }, inventory);

    entityManager.create(node);
    entityManager.tag(node, 'resource');
    entityManager.tag(node, 'bush');
    resourceNodes.push(node);
  }

  loadingBar.style.width = '80%';

  // Register systems with engine
  engine.registerUpdateable(player);
  engine.registerUpdateable(entityManager);

  // Day/night cycle
  let dayAngle = 0;
  const dayLength = 300; // 5 minutes for full cycle

  engine.registerUpdateable({
    update(dt: number): void {
      dayAngle += (dt / dayLength) * Math.PI * 2;
      const dayFactor = Math.max(0, Math.sin(dayAngle));

      lighting.updateDayNight(dayAngle, dayLength, renderer);
      sky.update(dayFactor);
    },
  });

  // Resource gathering system
  let gatherTarget: ResourceNode | null = null;
  let gatherProgress: number = 0;
  let nearResource: ResourceNode | null = null;
  const interactRadius = 5;
  const autoSaveState = { lastMinute: -1 };

  // Building preview state
  let buildingPreviewActive: boolean = false;
  let buildingPreviewRotation: number = 0;

  // Raycaster for interaction
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);

  engine.registerUpdateable({
    update(dt: number): void {
      // Find nearest resource node
      nearResource = null;
      let nearestDist = interactRadius;

      for (const node of resourceNodes) {
        if (!node.isActive()) continue;
        const dist = player.distanceTo(node);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearResource = node;
        }
      }

      // Show/hide interaction prompt
      if (nearResource && !gatherTarget) {
        const name = nearResource.getName().replace('_', ' ');
        hud.showPrompt(`[E] Gather ${name} (dist: ${nearestDist.toFixed(1)})`);
      } else if (!gatherTarget) {
        hud.hidePrompt();
      }

      // Handle interaction — gather
      if (input.isActionJustPressed('interact') && nearResource && !gatherTarget) {
        const toolType = toolManager.getEquippedToolType();
        const durabilityWear = toolManager.getEquippedTool() ? 0.5 : 0;
        const result = nearResource.startGather(toolType, durabilityWear);
        if (result) {
          gatherTarget = nearResource;
          gatherProgress = 0;
          Logger.info('Main', `Started gathering ${nearResource.getName()}`);
        }
      }

      // Process gathering
      if (gatherTarget && gatherTarget.isActive()) {
        gatherProgress += dt;
        const speedMult = toolManager.getSpeedMultiplier();
        const totalGatherTime = gatherTarget.getGatherDuration(speedMult);
        const progress = Math.min(gatherProgress / totalGatherTime, 1);
        hud.showGatherProgress(progress);

        if (gatherProgress >= totalGatherTime) {
          hud.hideGatherProgress();

          // Wear tool durability
          if (toolManager.getEquippedToolId()) {
            const wearResult = toolManager.wearTool(gatherTarget.durabilityWearPerTickPublic);
            if (wearResult.toolBroken) {
              toolManager.unequipTool();
              hud.showPrompt('Tool broke! Unequipped.');
            }
            toolManager.saveToInventory(inventory);
          }

          gatherTarget = null;
          gatherProgress = 0;
        }
      } else if (!gatherTarget) {
        hud.hideGatherProgress();
      }

      // Building preview update
      if (buildingPreviewActive) {
        const pos = player.getPosition();
        buildingSystem.updatePreview(pos.x, pos.z, buildingPreviewRotation, terrain);
      }

      // Auto-save every 30 seconds (throttled to once per second)
      const currentMinute = Math.floor(time.getGameTime() / 30);
      if (currentMinute !== autoSaveState.lastMinute) {
        autoSaveState.lastMinute = currentMinute;
        saveSystem.autoSave(
          {
            position: { x: player.getPosition().x, y: player.getPosition().y, z: player.getPosition().z },
            rotation: { x: player.getRotation().x, y: player.getRotation().y, z: player.getRotation().z },
            health: player.getHealth(),
            hunger: player.getHunger(),
            stamina: player.getStamina(),
            inventory: inventory.serialize(),
          },
          {
            gameTime: time.getGameTime(),
            dayAngle: dayAngle,
          }
        );
      }
    },
  });

  // HUD updater
  engine.registerUpdateable({
    update(dt: number): void {
      // Update stats bars
      hud.updateHealth(player.getHealth(), player.getMaxHealth());
      hud.updateHunger(player.getHunger(), player.getMaxHunger());
      hud.updateStamina(player.getStamina(), player.getMaxStamina());

      // Update hotbar
      const slots = inventory.getAllSlots().slice(0, 9);
      hud.updateHotbar(slots);
    },
  });

  // Debug overlay updater (keep legacy overlay as backup)
  let debugUpdateTimer = 0;
  engine.registerUpdateable({
    update(dt: number): void {
      debugUpdateTimer += dt;
      if (debugUpdateTimer < 0.5) return; // Update every 0.5s
      debugUpdateTimer = 0;

      const stats = engine.getStats();
      const invSummary = inventory.getSummary();
      const itemCountStr = invSummary.length > 0
        ? invSummary.slice(0, 3).map(s => `${s.name}: ${s.count}`).join(' | ')
        : 'Empty';

      debugOverlay.innerHTML = `
        <div>FPS: ${stats.fps} | Entities: ${stats.entities}</div>
        <div>Time: ${stats.gameTime}</div>
        <div style="color:#ff6666;">HP: ${Math.round(player.getHealth())}/${player.getMaxHealth()}</div>
        <div style="color:#ffaa44;">Hunger: ${Math.round(player.getHunger())}/${player.getMaxHunger()}</div>
        <div style="color:#44aaff;">Stamina: ${Math.round(player.getStamina())}/${player.getMaxStamina()}</div>
        <div style="margin-top:4px; color:#aaa;">${itemCountStr}</div>
        <div style="margin-top:4px; color:#888; font-size:10px;">
          WASD: Move | Shift: Sprint | Space: Jump<br>
          Click to lock mouse | E: Gather | ESC: Release<br>
          Auto-saves every 30s
        </div>
      `;
    },
  });

  // Pointer lock on canvas click
  renderer.getDOMElement().addEventListener('click', () => {
    if (!input.isPointerLocked()) {
      input.requestPointerLock();
    }
  });

  // Global key bindings for UI and tools
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Inventory toggle (I key)
    if (e.code === 'KeyI' && !e.repeat) {
      inventoryUI.toggle();
      return;
    }

    // Building preview (Q key)
    if (e.code === 'KeyQ' && !e.repeat) {
      buildingPreviewActive = !buildingPreviewActive;
      if (buildingPreviewActive) {
        // Auto-select first building item in inventory
        const buildingItems = ['wooden_wall', 'wooden_floor', 'stone_wall'];
        const selectedBuilding = buildingItems.find(id => inventory.getItemCount(id) > 0);
        if (selectedBuilding) {
          buildingSystem.startPreview(selectedBuilding, renderer);
          hud.showPrompt(`Building: ${getItemDefinition(selectedBuilding)?.name ?? selectedBuilding} — Q: toggle | R: rotate | Click: place | ESC: cancel`);
        } else {
          buildingPreviewActive = false;
          hud.showPrompt('No building items in inventory!');
        }
      } else {
        buildingSystem.stopPreview();
        hud.hidePrompt();
      }
      return;
    }

    // Building rotation (R key, only during preview)
    if (e.code === 'KeyR' && buildingPreviewActive) {
      buildingPreviewRotation = (buildingPreviewRotation + 45) % 360;
      buildingSystem.updatePreview(
        player.getPosition().x,
        player.getPosition().z,
        buildingPreviewRotation,
        terrain
      );
      return;
    }

    // Build placement (Left click during preview)
    // Handled in the mouse click listener below

    // Tool quick-equip (number keys 1-9 for hotbar)
    if (!e.repeat && e.key >= '1' && e.key <= '9') {
      const hotbarIndex = parseInt(e.key) - 1;
      const hotbarSlot = inventory.getSlot(hotbarIndex);
      if (hotbarSlot.itemId && getItemDefinition(hotbarSlot.itemId)?.type === 'tool') {
        if (toolManager.getEquippedToolId() === hotbarSlot.itemId) {
          toolManager.unequipTool();
          hud.showPrompt('Tool unequipped');
        } else {
          toolManager.equipTool(hotbarSlot.itemId, inventory);
          const info = toolManager.getDurabilityInfo();
          if (info) {
            hud.showPrompt(`${getItemDefinition(hotbarSlot.itemId)?.name} equipped — ${info.current}/${info.max} durability`);
          }
        }
      }
      return;
    }

    // Inventory keyboard navigation
    inventoryUI.handleKeyDown(e.code);
  });

  // Mouse click for building placement
  renderer.getDOMElement().addEventListener('click', () => {
    if (buildingPreviewActive && input.isPointerLocked()) {
      if (buildingSystem.placeBuilding(inventory, entityManager, renderer, terrain)) {
        const buildings = buildingSystem.getPlacedBuildings();
        hud.showPrompt(`Building placed! Total: ${buildings.length}`);
      }
    }
  });

  loadingBar.style.width = '90%';

  // Start the game
  engine.start();

  loadingBar.style.width = '100%';

  // Hide loading screen
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }, 300);

  Logger.info('Main', 'Game started successfully!');

  // Handle window unload
  window.addEventListener('beforeunload', () => {
    saveSystem.autoSave(
      {
        position: { x: player.getPosition().x, y: player.getPosition().y, z: player.getPosition().z },
        rotation: { x: player.getRotation().x, y: player.getRotation().y, z: player.getRotation().z },
        health: player.getHealth(),
        hunger: player.getHunger(),
        stamina: player.getStamina(),
        inventory: inventory.serialize(),
      },
      {
        gameTime: time.getGameTime(),
        dayAngle: dayAngle,
      }
    );
    engine.destroy();
    entityManager.dispose();
    terrain.dispose();
    lighting.dispose();
    sky.dispose();
  });
}

/**
 * Seeded random number generator.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
