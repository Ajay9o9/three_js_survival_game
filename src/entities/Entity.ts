/**
 * Base entity class providing common properties and lifecycle methods
 * for all game entities.
 */
import * as THREE from 'three';
import { Renderer } from '../core/Renderer.js';
import { Logger } from '../utils/Logger.js';

export interface EntityConfig {
  name: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  visible?: boolean;
}

export abstract class Entity {
  protected readonly name: string;
  protected readonly mesh: THREE.Object3D;
  protected _position: THREE.Vector3;
  protected _rotation: THREE.Euler;
  protected _scale: THREE.Vector3;
  protected _visible: boolean;
  protected _active: boolean;
  protected renderer: Renderer | null = null;

  constructor(config: EntityConfig) {
    this.name = config.name;
    this._position = new THREE.Vector3(config.position.x, config.position.y, config.position.z);
    this._rotation = new THREE.Euler(
      config.rotation?.x ?? 0,
      config.rotation?.y ?? 0,
      config.rotation?.z ?? 0
    );
    this._scale = new THREE.Vector3(
      config.scale?.x ?? 1,
      config.scale?.y ?? 1,
      config.scale?.z ?? 1
    );
    this._visible = config.visible ?? true;
    this._active = true;

    // Create the mesh (pass config so subclasses don't need `this`)
    this.mesh = this.createMesh(config);
    this.setupMesh();
  }

  /**
   * Apply position/rotation/scale/visibility to the mesh.
   */
  protected setupMesh(): void {
    this.mesh.position.copy(this._position);
    this.mesh.rotation.copy(this._rotation);
    this.mesh.scale.copy(this._scale);
    this.mesh.visible = this._visible;
    this.mesh.name = this.name;
  }

  /**
   * Create the Three.js mesh for this entity. Override in subclasses.
   * Receives config so subclasses don't need `this` before super().
   */
  protected abstract createMesh(config: EntityConfig): THREE.Object3D;

  /**
   * Update entity state. Called each frame.
   */
  abstract update(dt: number): void;

  /**
   * Add entity to the renderer's scene.
   */
  addToRenderer(renderer: Renderer): void {
    this.renderer = renderer;
    renderer.addObject(this.mesh);
  }

  /**
   * Remove entity from the renderer's scene.
   */
  removeFromRenderer(): void {
    if (this.renderer) {
      this.renderer.removeObject(this.mesh);
      this.renderer = null;
    }
  }

  /**
   * Mark entity for destruction.
   */
  destroy(): void {
    this._active = false;
    this._visible = false;
    this.removeFromRenderer();
    this.dispose();
    Logger.debug('Entity', `${this.name} destroyed`);
  }

  /**
   * Dispose of entity resources. Override in subclasses.
   */
  protected dispose(): void {
    // Dispose mesh geometry and materials
    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m: THREE.Material) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
  }

  // --- Getters & Setters ---

  getPosition(): THREE.Vector3 {
    return this._position;
  }

  setPosition(x: number, y: number, z: number): void {
    this._position.set(x, y, z);
    this.mesh.position.copy(this._position);
  }

  setPositionVector(pos: THREE.Vector3): void {
    this._position.copy(pos);
    this.mesh.position.copy(this._position);
  }

  getRotation(): THREE.Euler {
    return this._rotation;
  }

  setRotation(x: number, y: number, z: number): void {
    this._rotation.set(x, y, z);
    this.mesh.rotation.copy(this._rotation);
  }

  setRotationY(y: number): void {
    this._rotation.y = y;
    this.mesh.rotation.y = y;
  }

  getRotationY(): number {
    return this._rotation.y;
  }

  getScale(): THREE.Vector3 {
    return this._scale;
  }

  setScale(x: number, y: number, z: number): void {
    this._scale.set(x, y, z);
    this.mesh.scale.copy(this._scale);
  }

  isVisible(): boolean {
    return this._visible;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
    this.mesh.visible = visible;
  }

  isActive(): boolean {
    return this._active;
  }

  setActive(active: boolean): void {
    this._active = active;
    if (!active) {
      this._visible = false;
      this.mesh.visible = false;
    }
  }

  getName(): string {
    return this.name;
  }

  getMesh(): THREE.Object3D {
    return this.mesh;
  }

  /**
   * Get the entity's bounding box.
   */
  getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    if (this.mesh instanceof THREE.Mesh) {
      box.setFromObject(this.mesh);
    } else {
      box.setFromCenterAndSize(this._position, this._scale);
    }
    return box;
  }

  /**
   * Check if this entity collides with another entity.
   */
  collidesWith(other: Entity, margin: number = 0): boolean {
    const myBox = this.getBoundingBox();
    const otherBox = other.getBoundingBox();
    return myBox.intersectsBox(otherBox);
  }

  /**
   * Move entity in a direction by a distance.
   */
  moveInDirection(direction: THREE.Vector3, distance: number): void {
    const newPos = this._position.clone().add(
      direction.clone().normalize().multiplyScalar(distance)
    );
    this.setPosition(newPos.x, newPos.y, newPos.z);
  }

  /**
   * Rotate entity around Y axis by an angle in radians.
   */
  rotateY(angle: number): void {
    this.setRotationY(this._rotation.y + angle);
  }

  /**
   * Face a target position.
   */
  faceTarget(target: THREE.Vector3): void {
    const dx = target.x - this._position.x;
    const dz = target.z - this._position.z;
    const angle = Math.atan2(dz, dx);
    this.setRotationY(angle);
  }

  /**
   * Calculate distance to another entity.
   */
  distanceTo(other: Entity): number {
    return this._position.distanceTo(other.getPosition());
  }

  /**
   * Calculate squared distance to another entity (faster, no sqrt).
   */
  distanceSquaredTo(other: Entity): number {
    return this._position.distanceToSquared(other.getPosition());
  }
}
