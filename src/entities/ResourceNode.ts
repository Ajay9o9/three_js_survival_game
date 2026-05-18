/**
 * Resource node entity — interactive world objects that can be gathered.
 * Represents trees, rocks, ore deposits, and berry bushes.
 */
import * as THREE from 'three';
import { Entity, EntityConfig } from './Entity.js';
import { Inventory } from '../systems/Inventory.js';
import { ResourceNode as ResourceType, ToolType } from '../systems/ItemDefinition.js';
import { Logger } from '../utils/Logger.js';

export interface ResourceNodeConfig extends EntityConfig {
  resourceType: ResourceType;
  resourceAmount: number;
  health: number;
  maxHealth: number;
  toolRequired: ToolType;
  gatherSpeed: number;
  dropItemIds: string[];
  dropAmounts: number[];
}

export class ResourceNode extends Entity {
  private readonly resourceType!: ResourceType;
  private readonly resourceAmount!: number;
  private health!: number;
  private readonly maxHealth!: number;
  private readonly toolRequired!: ToolType;
  private readonly gatherSpeed!: number;
  private readonly dropItemIds!: string[];
  private readonly dropAmounts!: number[];
  /** Durability worn per gather tick (set when gathering starts). */
  private durabilityWearPerTick: number = 0;
  private isGathering: boolean = false;
  /** Expose durability wear per tick for the tool manager. */
  get durabilityWearPerTickPublic(): number {
    return this.durabilityWearPerTick;
  }
  private gatherProgress: number = 0;
  private readonly gatherDuration: number = 1.0; // seconds to gather with correct tool
  private meshRef!: THREE.Group;
  private healthBar: THREE.Mesh | null = null;
  private highlightMesh: THREE.Mesh | null = null;
  private inventory: Inventory | null = null;

  constructor(config: ResourceNodeConfig, inventory?: Inventory) {
    super(config);
    // After super(), mesh is ready — store reference
    this.meshRef = this.mesh as THREE.Group;
    this.resourceType = config.resourceType;
    this.resourceAmount = config.resourceAmount;
    this.health = config.health;
    this.maxHealth = config.maxHealth;
    this.toolRequired = config.toolRequired;
    this.gatherSpeed = config.gatherSpeed;
    // gatherDuration is inverse of gatherSpeed: higher speed = shorter duration
    this.gatherDuration = 1.0 / config.gatherSpeed;
    this.dropItemIds = config.dropItemIds;
    this.dropAmounts = config.dropAmounts;
    this.inventory = inventory ?? null;
  }

  /**
   * Create the visual mesh for this resource node.
   * Called during Entity constructor — resourceType is already set.
   */
  protected createMesh(config: EntityConfig): THREE.Group {
    const group = new THREE.Group();

    // resourceType is set before super() call in Entity, so we can use this.resourceType here
    // Wait — no, resourceType is set AFTER super() in our constructor.
    // We need to read it from config instead.
    const rType = (config as ResourceNodeConfig).resourceType;

    switch (rType) {
      case ResourceType.TREE:
        this.createTreeMesh(group);
        break;
      case ResourceType.ROCK:
        this.createRockMesh(group);
        break;
      case ResourceType.ORE:
        this.createOreMesh(group);
        break;
      case ResourceType.BUSH:
        this.createBushMesh(group);
        break;
    }

    // Add health bar (hidden by default)
    this.createHealthBar(group);

    // Add highlight ring (visible when player is near)
    this.createHighlight(group);

    return group;
  }

  /**
   * Create tree mesh.
   */
  private createTreeMesh(group: THREE.Group): void {
    const height = 3 + Math.random() * 2;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, height, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.0,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.name = 'trunk';
    group.add(trunk);

    // Foliage
    const foliageGeo = new THREE.ConeGeometry(1.5, 2.5, 8);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x228B22,
      roughness: 0.8,
      metalness: 0.0,
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = height + 0.5;
    foliage.castShadow = true;
    foliage.name = 'foliage';
    group.add(foliage);

    // Second foliage layer
    const foliage2Geo = new THREE.ConeGeometry(1.2, 2, 8);
    const foliage2 = new THREE.Mesh(foliage2Geo, foliageMat);
    foliage2.position.y = height + 1.8;
    foliage2.castShadow = true;
    foliage2.name = 'foliage2';
    group.add(foliage2);
  }

  /**
   * Create rock mesh.
   */
  private createRockMesh(group: THREE.Group): void {
    const size = 0.5 + Math.random() * 0.8;
    const rockGeo = new THREE.DodecahedronGeometry(size, 1);

    // Deform vertices for natural look
    const positions = rockGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += (Math.random() - 0.5) * 0.15;
      positions[i + 1] += (Math.random() - 0.5) * 0.15;
      positions[i + 2] += (Math.random() - 0.5) * 0.15;
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.45 + Math.random() * 0.15, 0.4 + Math.random() * 0.1, 0.35 + Math.random() * 0.1),
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = size * 0.5;
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.name = 'rock';
    group.add(rock);
  }

  /**
   * Create ore deposit mesh.
   */
  private createOreMesh(group: THREE.Group): void {
    const size = 0.8 + Math.random() * 0.5;
    const oreGeo = new THREE.DodecahedronGeometry(size, 1);

    const positions = oreGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += (Math.random() - 0.5) * 0.2;
      positions[i + 1] += (Math.random() - 0.5) * 0.2;
      positions[i + 2] += (Math.random() - 0.5) * 0.2;
    }
    oreGeo.computeVertexNormals();

    const oreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.35, 0.3, 0.3),
      roughness: 0.8,
      metalness: 0.3,
      flatShading: true,
    });
    const ore = new THREE.Mesh(oreGeo, oreMat);
    ore.position.y = size * 0.5;
    ore.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    ore.castShadow = true;
    ore.receiveShadow = true;
    ore.name = 'ore';
    group.add(ore);

    // Ore veins (smaller glowing crystals)
    for (let i = 0; i < 3; i++) {
      const veinGeo = new THREE.OctahedronGeometry(0.1 + Math.random() * 0.1, 0);
      const veinMat = new THREE.MeshStandardMaterial({
        color: 0x4488cc,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x224466,
        emissiveIntensity: 0.3,
      });
      const vein = new THREE.Mesh(veinGeo, veinMat);
      vein.position.set(
        (Math.random() - 0.5) * size * 0.8,
        size * 0.3 + Math.random() * size * 0.5,
        (Math.random() - 0.5) * size * 0.8
      );
      vein.name = `vein_${i}`;
      group.add(vein);
    }
  }

  /**
   * Create bush mesh.
   */
  private createBushMesh(group: THREE.Group): void {
    const radius = 0.4 + Math.random() * 0.3;

    const bushGeo = new THREE.SphereGeometry(radius, 8, 6);
    const bushMat = new THREE.MeshStandardMaterial({
      color: 0x2d6b2d,
      roughness: 0.8,
      metalness: 0.0,
    });
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.y = radius * 0.7;
    bush.scale.y = 0.7;
    bush.castShadow = true;
    bush.name = 'bush';
    group.add(bush);

    // Berries
    for (let i = 0; i < 5; i++) {
      const berryGeo = new THREE.SphereGeometry(0.05, 4, 4);
      const berryMat = new THREE.MeshStandardMaterial({
        color: 0xcc3333,
        roughness: 0.5,
        metalness: 0.1,
      });
      const berry = new THREE.Mesh(berryGeo, berryMat);
      const angle = (i / 5) * Math.PI * 2;
      berry.position.set(
        Math.cos(angle) * radius * 0.5,
        radius * 0.6 + Math.random() * 0.1,
        Math.sin(angle) * radius * 0.5
      );
      berry.name = `berry_${i}`;
      group.add(berry);
    }
  }

  /**
   * Create health bar mesh.
   */
  private createHealthBar(group: THREE.Group): void {
    const barWidth = 1.5;
    const barHeight = 0.08;
    const barDepth = 0.02;

    // Background
    const bgGeo = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.y = 3.5;
    bg.name = 'healthBarBg';
    group.add(bg);

    // Foreground (health)
    const fgGeo = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
    const fgMat = new THREE.MeshBasicMaterial({ color: 0x44cc44 });
    const fg = new THREE.Mesh(fgGeo, fgMat);
    fg.position.y = 3.5;
    fg.position.x = -barWidth / 2 + 0.01;
    fg.name = 'healthBarFg';
    group.add(fg);

    this.healthBar = fg;
  }

  /**
   * Create highlight ring.
   */
  private createHighlight(group: THREE.Group): void {
    const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.name = 'highlight';
    group.add(ring);

    this.highlightMesh = ring;
  }

  /**
   * Update resource node state.
   */
  update(dt: number): void {
    if (!this.isActive()) return;

    // Update health bar visual
    this.updateHealthBar();

    // Update highlight visibility
    this.updateHighlight(dt);

    // Process gathering
    if (this.isGathering) {
      this.gatherProgress += dt;
      if (this.gatherProgress >= this.gatherDuration) {
        this.completeGather();
      }
    }
  }

  /**
   * Update health bar visual.
   */
  private updateHealthBar(): void {
    if (!this.healthBar) return;

    const healthRatio = this.health / this.maxHealth;
    const barWidth = 1.5;

    // Scale the foreground bar
    this.healthBar.scale.x = Math.max(0.01, healthRatio);
    this.healthBar.position.x = -barWidth / 2 + (barWidth * healthRatio) / 2;

    // Color based on health
    if (this.healthBar.material instanceof THREE.MeshBasicMaterial) {
      if (healthRatio > 0.6) {
        this.healthBar.material.color.setHex(0x44cc44);
      } else if (healthRatio > 0.3) {
        this.healthBar.material.color.setHex(0xcccc44);
      } else {
        this.healthBar.material.color.setHex(0xcc4444);
      }
    }
  }

  /**
   * Update highlight visibility.
   */
  private updateHighlight(dt: number): void {
    if (!this.highlightMesh) return;

    // Pulse effect
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.5;
    if (this.highlightMesh.material instanceof THREE.MeshBasicMaterial) {
      this.highlightMesh.material.opacity = pulse * 0.6;
    }
  }

  /**
   * Get the gather duration in seconds, adjusted by tool speed multiplier.
   * @param speedMultiplier - Tool speed multiplier (default 1.0 = no tool).
   */
  getGatherDuration(speedMultiplier: number = 1.0): number {
    return this.gatherDuration / speedMultiplier;
  }

  /**
   * Get the tool type required for gathering.
   */
  getToolRequired(): ToolType {
    return this.toolRequired;
  }

  /**
   * Start gathering this resource node.
   * @param toolType - The tool type being used.
   * @param durabilityWear - Amount of durability to consume per gather tick.
   * @returns true if gathering started successfully.
   */
  startGather(toolType: ToolType, durabilityWear: number = 0): boolean {
    if (this.isGathering) return false;
    if (this.health <= 0) return false;

    // Tool check — warn if wrong tool but still allow gathering
    if (this.toolRequired !== ToolType.NONE && toolType !== this.toolRequired) {
      Logger.debug('ResourceNode', `No correct tool: need ${this.toolRequired}, gathering without tool (slower)`);
    }

    this.isGathering = true;
    this.durabilityWearPerTick = durabilityWear;
    return true;
  }

  /**
   * Complete the gathering process.
   */
  private completeGather(): void {
    this.isGathering = false;
    this.gatherProgress = 0;

    // Deal damage scaled by base gather speed
    const damage = this.gatherSpeed;
    this.health -= damage;

    // Drop items
    if (this.inventory) {
      for (let i = 0; i < this.dropItemIds.length; i++) {
        const itemId = this.dropItemIds[i];
        const amount = this.dropAmounts[i] || 1;
        const remaining = this.inventory.addItem(itemId, amount);
        if (remaining > 0) {
          Logger.warn('ResourceNode', `Inventory full: ${remaining} ${itemId} not added`);
        }
      }
    }

    // Check if destroyed
    if (this.health <= 0) {
      this.destroy();
      Logger.info('ResourceNode', `${this.name} destroyed, dropped items`);
    } else {
      Logger.debug('ResourceNode', `${this.name} damaged: ${this.health}/${this.maxHealth}`);
    }
  }

  /**
   * Get remaining health.
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get max health.
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Get resource type.
   */
  getResourceType(): ResourceType {
    return this.resourceType;
  }

  /**
   * Check if this node is destroyed.
   */
  isDestroyed(): boolean {
    return this.health <= 0;
  }

  /**
   * Override dispose to clean up group.
   */
  protected dispose(): void {
    this.meshRef.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    super.dispose();
  }
}
