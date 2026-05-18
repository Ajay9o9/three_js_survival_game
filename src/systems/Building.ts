/**
 * Building system — place and remove structures with grid snapping.
 */
import * as THREE from 'three';
import { Renderer } from '../core/Renderer.js';
import { EntityManager } from '../entities/EntityManager.js';
import { Terrain } from '../world/Terrain.js';
import { Inventory } from './Inventory.js';
import { getItemDefinition, ItemDefinition, ItemType } from './ItemDefinition.js';
import { Logger } from '../utils/Logger.js';

/** A placed building structure. */
export interface PlacedBuilding {
  id: string;
  itemId: string;
  position: { x: number; y: number; z: number };
  rotation: number; // degrees around Y axis
  mesh: THREE.Group;
  /** The item definition for this building type. */
  definition: ItemDefinition;
}

/** Configuration for a building placement attempt. */
export interface PlaceBuildingConfig {
  itemId: string;
  position: { x: number; z: number };
  rotation: number; // degrees around Y
}

/** Result of a building placement attempt. */
export interface BuildResult {
  success: boolean;
  building?: PlacedBuilding;
  message?: string;
}

/**
 * Manages building placement, removal, and the placement preview.
 */
export class BuildingSystem {
  private placedBuildings: PlacedBuilding[] = [];
  private previewMesh: THREE.Object3D | null = null;
  private previewMaterial: THREE.MeshBasicMaterial | null = null;
  private previewPosition: { x: number; z: number } | null = null;
  private previewRotation: number = 0;
  private previewItemId: string | null = null;

  /** Snap distance for grid snapping (in world units). */
  private readonly gridSize: number = 1.0;

  constructor() {}

  /**
   * Snap a position to the building grid.
   */
  snapToGrid(x: number, z: number): { x: number; z: number } {
    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      z: Math.round(z / this.gridSize) * this.gridSize,
    };
  }

  /**
   * Start placement preview for a building item.
   * @param itemId - The building item ID.
   * @param renderer - The renderer for adding the preview mesh.
   */
  startPreview(itemId: string, renderer: Renderer): void {
    const def = getItemDefinition(itemId);
    if (!def || def.type !== ItemType.BUILDING) {
      Logger.warn('Building', `Cannot preview non-building item: ${itemId}`);
      return;
    }

    this.previewItemId = itemId;
    this.previewRotation = 0;

    // Create preview mesh (simple colored box)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.previewMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    this.previewMesh = new THREE.Mesh(geometry, this.previewMaterial);
    this.previewMesh.visible = false;

    renderer.scene.add(this.previewMesh);
    Logger.info('Building', `Preview started for ${def.name}`);
  }

  /**
   * Update the preview position.
   * @param x - World X position.
   * @param z - World Z position.
   * @param rotation - Y rotation in degrees.
   * @param terrain - Terrain for height lookup.
   */
  updatePreview(x: number, z: number, rotation: number, terrain: Terrain): void {
    if (!this.previewMesh || !this.previewMaterial) return;

    const snapped = this.snapToGrid(x, z);
    const terrainHeight = terrain.getHeight(snapped.x, snapped.z);
    const y = terrainHeight + 0.5; // Center on surface

    this.previewPosition = { x: snapped.x, z: snapped.z };
    this.previewRotation = rotation;

    this.previewMesh.position.set(snapped.x, y, snapped.z);
    this.previewMesh.rotation.y = THREE.MathUtils.degToRad(rotation);

    // Scale preview based on building type
    const def = getItemDefinition(this.previewItemId!);
    if (def) {
      if (def.id.includes('wall')) {
        this.previewMesh.scale.set(1, 2, 0.2);
      } else if (def.id.includes('floor')) {
        this.previewMesh.scale.set(1, 0.1, 1);
      } else {
        this.previewMesh.scale.set(1, 1, 1);
      }
    }

    // Check if placement is valid
    const canPlace = this.canPlace(this.previewItemId!, snapped.x, snapped.z);
    this.previewMaterial.color.setHex(canPlace ? 0x00ff00 : 0xff0000);
    this.previewMesh.visible = true;
  }

  /**
   * Attempt to place a building at the preview position.
   * @param inventory - Player inventory to consume ingredients from.
   * @param entityManager - Entity manager to add the building entity.
   * @param renderer - Renderer for adding the building mesh.
   * @param terrain - Terrain for height lookup.
   * @returns Result of the placement attempt.
   */
  placeBuilding(
    inventory: Inventory,
    entityManager: EntityManager,
    renderer: Renderer,
    terrain: Terrain,
  ): BuildResult {
    if (!this.previewItemId || !this.previewPosition) {
      return { success: false, message: 'No preview active' };
    }

    const def = getItemDefinition(this.previewItemId);
    if (!def) {
      return { success: false, message: 'Unknown building item' };
    }

    // Check if player has the building item
    if (inventory.getItemCount(this.previewItemId) < 1) {
      return { success: false, message: 'No building items in inventory' };
    }

    // Check if position is valid
    if (!this.canPlace(this.previewItemId, this.previewPosition.x, this.previewPosition.z)) {
      return { success: false, message: 'Cannot place here (blocked or invalid terrain)' };
    }

    // Check build cost
    if (def.buildCost) {
      for (const [costItemId, costAmount] of Object.entries(def.buildCost)) {
        if (inventory.getItemCount(costItemId) < costAmount) {
          return { success: false, message: `Need ${costAmount}x ${costItemId}` };
        }
      }
    }

    // Consume ingredients and the building item
    if (def.buildCost) {
      for (const [costItemId, costAmount] of Object.entries(def.buildCost)) {
        inventory.removeItem(costItemId, costAmount);
      }
    }
    inventory.removeItem(this.previewItemId, 1);

    // Create the building mesh
    const snapped = this.snapToGrid(this.previewPosition.x, this.previewPosition.z);
    const terrainHeight = terrain.getHeight(snapped.x, snapped.z);
    const y = terrainHeight + 0.5;

    const buildingMesh = this.createBuildingMesh(def);
    buildingMesh.position.set(snapped.x, y, snapped.z);
    buildingMesh.rotation.y = THREE.MathUtils.degToRad(this.previewRotation);

    renderer.scene.add(buildingMesh);

    const building: PlacedBuilding = {
      id: `building_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemId: this.previewItemId,
      position: { x: snapped.x, y, z: snapped.z },
      rotation: this.previewRotation,
      mesh: buildingMesh,
      definition: def,
    };

    this.placedBuildings.push(building);
    Logger.info('Building', `Placed ${def.name} at (${snapped.x.toFixed(1)}, ${snapped.z.toFixed(1)})`);

    this.stopPreview();
    return { success: true, building, message: `Placed ${def.name}` };
  }

  /**
   * Check if a building can be placed at the given position.
   */
  canPlace(itemId: string, x: number, z: number): boolean {
    // Check terrain is valid (not water/void)
    // For now, just check no other building is at this exact spot
    const snapped = this.snapToGrid(x, z);
    const existing = this.placedBuildings.find(
      b => Math.abs(b.position.x - snapped.x) < 0.01 && Math.abs(b.position.z - snapped.z) < 0.01
    );
    return !existing;
  }

  /**
   * Remove a placed building and return its item to inventory.
   */
  removeBuilding(buildingId: string, inventory: Inventory): BuildResult {
    const index = this.placedBuildings.findIndex(b => b.id === buildingId);
    if (index === -1) {
      return { success: false, message: 'Building not found' };
    }

    const building = this.placedBuildings[index];

    // Return building item to inventory
    inventory.addItem(building.itemId, 1);

    // Return build cost items
    if (building.definition.buildCost) {
      for (const [costItemId, costAmount] of Object.entries(building.definition.buildCost)) {
        inventory.addItem(costItemId, Math.floor(costAmount * 0.5)); // 50% refund
      }
    }

    // Remove mesh
    building.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });

    this.placedBuildings.splice(index, 1);
    Logger.info('Building', `Removed ${building.definition.name}, refunded items`);

    return { success: true, message: `Removed ${building.definition.name}` };
  }

  /**
   * Get all placed buildings.
   */
  getPlacedBuildings(): PlacedBuilding[] {
    return [...this.placedBuildings];
  }

  /**
   * Stop the placement preview.
   */
  stopPreview(): void {
    if (this.previewMesh) {
      this.previewMesh.visible = false;
      this.previewMesh = null;
    }
    this.previewMaterial = null;
    this.previewPosition = null;
    this.previewItemId = null;
    this.previewRotation = 0;
  }

  /**
   * Create a visual mesh for a building based on its type.
   */
  private createBuildingMesh(def: ItemDefinition): THREE.Group {
    const group = new THREE.Group();
    const color = this.getBuildingColor(def.id);

    let geometry: THREE.BufferGeometry;
    let scale: [number, number, number];

    if (def.id.includes('wall')) {
      geometry = new THREE.BoxGeometry(1, 2, 0.2);
      scale = [1, 1, 1];
    } else if (def.id.includes('floor')) {
      geometry = new THREE.BoxGeometry(1, 0.1, 1);
      scale = [1, 1, 1];
    } else {
      geometry = new THREE.BoxGeometry(1, 1, 1);
      scale = [1, 1, 1];
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = def.id;
    group.add(mesh);

    return group;
  }

  /**
   * Get a color for a building type.
   */
  private getBuildingColor(itemId: string): number {
    if (itemId.includes('wooden')) return 0x8B4513; // Brown
    if (itemId.includes('stone')) return 0x808080;  // Gray
    return 0x888888;
  }

  /**
   * Serialize building state for saving.
   */
  serialize(): string {
    return JSON.stringify({
      buildings: this.placedBuildings.map(b => ({
        id: b.id,
        itemId: b.itemId,
        position: b.position,
        rotation: b.rotation,
      })),
    });
  }

  /**
   * Deserialize building state from save data.
   * Note: Meshes won't be recreated from save data — they'll need to be reloaded.
   */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.placedBuildings = (parsed.buildings || []).map((b: any) => ({
        ...b,
        definition: getItemDefinition(b.itemId) || { id: b.itemId, name: b.itemId, type: ItemType.BUILDING, stackSize: 32 } as ItemDefinition,
        mesh: new THREE.Group(), // Placeholder — mesh needs to be recreated
      }));
    } catch {
      // Ignore deserialization errors
    }
  }
}
