/**
 * Player entity with third-person character mesh, movement, and camera.
 */
import * as THREE from 'three';
import { Entity, EntityConfig } from './Entity.js';
import { Input } from '../core/Input.js';
import { Time } from '../core/Time.js';
import { Terrain } from '../world/Terrain.js';
import { Renderer } from '../core/Renderer.js';
import { Inventory } from '../systems/Inventory.js';
import { Logger } from '../utils/Logger.js';

export interface PlayerConfig extends EntityConfig {
  moveSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  gravity: number;
  cameraDistance: number;
  cameraHeight: number;
  cameraSmoothness: number;
  mouseSensitivity: number;
}

export class Player extends Entity {
  private readonly input: Input;
  private readonly time: Time;
  private readonly terrain: Terrain;
  private readonly config: PlayerConfig;

  // Movement state
  private velocityY: number = 0;
  private grounded: boolean = true;
  private sprinting: boolean = false;
  private yaw: number = 0;
  private pitch: number = 0;

  // Camera
  private cameraTarget: THREE.Vector3;
  private cameraOffset: THREE.Vector3;
  private currentCameraPos: THREE.Vector3;

  // Character mesh group
  private characterGroup!: THREE.Group;

  // Stats
  private health: number = 100;
  private maxHealth: number = 100;
  private hunger: number = 100;
  private maxHunger: number = 100;
  private stamina: number = 100;
  private maxStamina: number = 100;

  private inventory: Inventory;

  constructor(config: Partial<PlayerConfig>, input: Input, time: Time, terrain: Terrain, inventory?: Inventory) {
    const fullConfig: PlayerConfig = {
      name: 'player',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      moveSpeed: 8,
      sprintMultiplier: 1.8,
      jumpForce: 8,
      gravity: -20,
      cameraDistance: 8,
      cameraHeight: 4,
      cameraSmoothness: 8,
      mouseSensitivity: 0.005,
      ...config,
    };

    super(fullConfig);

    // After super(), the mesh is ready — store reference
    this.characterGroup = this.mesh as THREE.Group;

    this.input = input;
    this.time = time;
    this.terrain = terrain;
    this.config = fullConfig;
    this.inventory = inventory ?? new Inventory({ width: 9, height: 4 }, 'player');

    // Camera setup
    this.cameraTarget = new THREE.Vector3(0, 2, 0);
    this.cameraOffset = new THREE.Vector3(0, this.config.cameraHeight, -this.config.cameraDistance);
    this.currentCameraPos = new THREE.Vector3(0, 6, 10);
  }

  /**
   * Create the player character mesh (simple humanoid).
   * Called during Entity constructor — cannot use `this.characterGroup`.
   */
  protected createMesh(_config: EntityConfig): THREE.Object3D {
    return this.buildCharacterMesh();
  }

  /**
   * Build the player character mesh (simple humanoid).
   */
  private buildCharacterMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.9, 0.35);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366cc,
      roughness: 0.7,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    body.name = 'body';
    group.add(body);

    // Head
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      roughness: 0.8,
      metalness: 0.0,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366cc,
      roughness: 0.7,
      metalness: 0.1,
    });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.45, 0.9, 0);
    leftArm.castShadow = true;
    leftArm.name = 'leftArm';
    group.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.45, 0.9, 0);
    rightArm.castShadow = true;
    rightArm.name = 'rightArm';
    group.add(rightArm);

    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x444466,
      roughness: 0.8,
      metalness: 0.0,
    });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.17, 0.2, 0);
    leftLeg.castShadow = true;
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.17, 0.2, 0);
    rightLeg.castShadow = true;
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    return group;
  }

  /**
   * Update player state each frame.
   */
  update(dt: number): void {
    if (!this.isActive()) return;

    this.handleInput(dt);
    this.handlePhysics(dt);
    this.updateCamera(dt);
    this.updateStats(dt);
    this.updateAnimation(dt);
  }

  /**
   * Handle player input (movement, camera rotation).
   */
  private handleInput(dt: number): void {
    // Mouse look (only when pointer is locked)
    if (this.input.isPointerLocked()) {
      const mouseDelta = this.input.getMouseDelta();
      this.yaw -= mouseDelta.x * this.config.mouseSensitivity;
      this.pitch -= mouseDelta.y * this.config.mouseSensitivity;
      this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
      Logger.debug('Player', `Mouse look: dx=${mouseDelta.x}, dy=${mouseDelta.y}, yaw=${this.yaw.toFixed(2)}, pitch=${this.pitch.toFixed(2)}`);
    } else {
      Logger.debug('Player', 'Mouse look skipped: pointer not locked');
    }

    // Movement direction (camera-relative)
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (this.input.isActionActive('moveForward')) moveDir.z += 1;
    if (this.input.isActionActive('moveBackward')) moveDir.z -= 1;
    if (this.input.isActionActive('moveLeft')) moveDir.x -= 1;
    if (this.input.isActionActive('moveRight')) moveDir.x += 1;

    // Sprint
    this.sprinting = this.input.isActionActive('sprint') && this.stamina > 0 && moveDir.length() > 0;

    // Jump
    if (this.input.isActionJustPressed('jump') && this.grounded) {
      this.velocityY = this.config.jumpForce;
      this.grounded = false;
    }

    // Apply movement relative to camera yaw
    if (moveDir.length() > 0) {
      moveDir.normalize();

      // Rotate movement direction by camera yaw
      const cos = Math.cos(this.yaw);
      const sin = Math.sin(this.yaw);
      // Camera forward = (cos, sin), camera right = (-sin, cos)
      const rotatedX = moveDir.z * cos - moveDir.x * sin;
      const rotatedZ = moveDir.z * sin + moveDir.x * cos;

      // Sprint speed
      const speed = this.sprinting
        ? this.config.moveSpeed * this.config.sprintMultiplier
        : this.config.moveSpeed;

      // Move
      const newX = this._position.x + rotatedX * speed * dt;
      const newZ = this._position.z + rotatedZ * speed * dt;

      // Clamp to world bounds
      const clamped = this.terrain.clampToWorld(newX, newZ);

      // Get terrain height at new position
      const terrainHeight = this.terrain.getHeight(clamped.x, clamped.z);

      this.setPosition(clamped.x, terrainHeight, clamped.z);

      // Face movement direction
      this.setRotationY(Math.atan2(rotatedX, rotatedZ));

      // Stamina drain when sprinting
      if (this.sprinting) {
        this.stamina = Math.max(0, this.stamina - 15 * dt);
      }
    } else {
      // Stamina regen when not sprinting
      if (!this.sprinting) {
        this.stamina = Math.min(this.maxStamina, this.stamina + 10 * dt);
      }
    }
  }

  /**
   * Handle physics (gravity, ground collision).
   */
  private handlePhysics(dt: number): void {
    // Apply gravity
    if (!this.grounded) {
      this.velocityY += this.config.gravity * dt;
    }

    // Update Y position
    const newY = this._position.y + this.velocityY * dt;

    // Ground collision
    const terrainHeight = this.terrain.getHeight(this._position.x, this._position.z);
    const playerBottom = newY - 0; // Player feet at position.y

    if (playerBottom <= terrainHeight) {
      this.setPosition(this._position.x, terrainHeight, this._position.z);
      this.velocityY = 0;
      this.grounded = true;
    } else {
      this.setPosition(this._position.x, newY, this._position.z);
      this.grounded = false;
    }
  }

  /**
   * Update camera position to follow player.
   */
  private updateCamera(dt: number): void {
    // Camera target is slightly above player
    this.cameraTarget.set(
      this._position.x,
      this._position.y + this.config.cameraHeight * 0.7,
      this._position.z
    );

    // Calculate desired camera position
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);

    const desiredX = this.cameraTarget.x + this.cameraOffset.z * cosYaw * cosPitch;
    const desiredY = this.cameraTarget.y + this.cameraOffset.z * sinPitch + this.cameraOffset.y;
    const desiredZ = this.cameraTarget.z + this.cameraOffset.z * sinYaw * cosPitch;

    // Smooth camera movement
    const smoothFactor = 1 - Math.exp(-this.config.cameraSmoothness * dt);
    this.currentCameraPos.x += (desiredX - this.currentCameraPos.x) * smoothFactor;
    this.currentCameraPos.y += (desiredY - this.currentCameraPos.y) * smoothFactor;
    this.currentCameraPos.z += (desiredZ - this.currentCameraPos.z) * smoothFactor;

    // Apply to renderer camera
    const renderer = this.renderer;
    if (renderer) {
      renderer.camera.position.copy(this.currentCameraPos);
      renderer.camera.lookAt(this.cameraTarget);
    }
  }

  /**
   * Update player stats (hunger depletion, health regen).
   */
  private updateStats(dt: number): void {
    // Hunger decreases over time
    this.hunger = Math.max(0, this.hunger - 0.5 * dt);

    // Health regen when hunger is high
    if (this.hunger > 50 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + 2 * dt);
    }

    // Health damage when hunger is zero
    if (this.hunger <= 0) {
      this.health = Math.max(0, this.health - 3 * dt);
    }
  }

  /**
   * Simple walking animation (leg/arm swing).
   */
  private updateAnimation(dt: number): void {
    const isMoving = this.input.isActionActive('moveForward') ||
                     this.input.isActionActive('moveBackward') ||
                     this.input.isActionActive('moveLeft') ||
                     this.input.isActionActive('moveRight');

    if (isMoving && this.grounded) {
      const speed = this.sprinting ? 12 : 8;
      const swing = Math.sin(this.time.getGameTime() * speed) * 0.5;

      // Animate legs
      const leftLeg = this.characterGroup.getObjectByName('leftLeg') as THREE.Object3D | undefined;
      const rightLeg = this.characterGroup.getObjectByName('rightLeg') as THREE.Object3D | undefined;
      if (leftLeg) {
        leftLeg.rotation.x = swing;
      }
      if (rightLeg) {
        rightLeg.rotation.x = -swing;
      }

      // Animate arms
      const leftArm = this.characterGroup.getObjectByName('leftArm') as THREE.Object3D | undefined;
      const rightArm = this.characterGroup.getObjectByName('rightArm') as THREE.Object3D | undefined;
      if (leftArm) {
        leftArm.rotation.x = -swing * 0.7;
      }
      if (rightArm) {
        rightArm.rotation.x = swing * 0.7;
      }
    } else {
      // Reset to idle
      const leftLeg = this.characterGroup.getObjectByName('leftLeg') as THREE.Object3D | undefined;
      const rightLeg = this.characterGroup.getObjectByName('rightLeg') as THREE.Object3D | undefined;
      const leftArm = this.characterGroup.getObjectByName('leftArm') as THREE.Object3D | undefined;
      const rightArm = this.characterGroup.getObjectByName('rightArm') as THREE.Object3D | undefined;

      [leftLeg, rightLeg, leftArm, rightArm].forEach(obj => {
        if (obj) {
          obj.rotation.x = 0;
        }
      });
    }
  }

  // --- Stats getters/setters ---

  getHealth(): number { return this.health; }
  getMaxHealth(): number { return this.maxHealth; }
  getHunger(): number { return this.hunger; }
  getMaxHunger(): number { return this.maxHunger; }
  getStamina(): number { return this.stamina; }
  getMaxStamina(): number { return this.maxStamina; }

  setHealth(value: number): void {
    this.health = Math.max(0, Math.min(this.maxHealth, value));
  }

  setHunger(value: number): void {
    this.hunger = Math.max(0, Math.min(this.maxHunger, value));
  }

  setStamina(value: number): void {
    this.stamina = Math.max(0, Math.min(this.maxStamina, value));
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    Logger.info('Player', `Took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eat(amount: number): void {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
  }

  // --- Inventory access ---

  getInventory(): Inventory {
    return this.inventory;
  }

  /**
   * Add items to player inventory.
   */
  addItem(itemId: string, count: number): number {
    return this.inventory.addItem(itemId, count);
  }

  /**
   * Remove items from player inventory.
   */
  removeItem(itemId: string, count: number): boolean {
    return this.inventory.removeItem(itemId, count);
  }

  /**
   * Check if player has an item.
   */
  hasItem(itemId: string, count: number = 1): boolean {
    return this.inventory.hasItem(itemId, count);
  }

  /**
   * Get count of an item in inventory.
   */
  getItemCount(itemId: string): number {
    return this.inventory.getItemCount(itemId);
  }

  // --- Camera control ---

  getCameraTarget(): THREE.Vector3 {
    return this.cameraTarget;
  }

  getYaw(): number {
    return this.yaw;
  }

  getPitch(): number {
    return this.pitch;
  }

  isSprinting(): boolean {
    return this.sprinting;
  }

  isGrounded(): boolean {
    return this.grounded;
  }

  /**
   * Get serialized inventory data for saving.
   */
  getInventorySaveData(): string {
    return this.inventory.serialize();
  }

  /**
   * Load inventory data from save.
   */
  loadInventoryData(json: string): boolean {
    return this.inventory.deserialize(json);
  }

  /**
   * Override dispose to clean up character group.
   */
  protected dispose(): void {
    this.characterGroup.traverse((child: THREE.Object3D) => {
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
