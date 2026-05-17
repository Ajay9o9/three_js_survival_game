/**
 * Entity manager handling creation, removal, and lifecycle
 * of all game entities.
 */
import * as THREE from 'three';
import { Entity } from './Entity.js';
import { Renderer } from '../core/Renderer.js';
import { Logger } from '../utils/Logger.js';

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private readonly renderer: Renderer;
  private readonly tagIndex: Map<string, string[]> = new Map();

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    Logger.info('EntityManager', 'Entity manager initialized');
  }

  /**
   * Create and add a new entity.
   */
  create(entity: Entity): string {
    if (this.entities.has(entity.getName())) {
      Logger.warn('EntityManager', `Entity "${entity.getName()}" already exists, replacing`);
      this.destroy(entity.getName());
    }

    entity.addToRenderer(this.renderer);
    this.entities.set(entity.getName(), entity);

    Logger.debug('EntityManager', `Entity created: ${entity.getName()}`);
    return entity.getName();
  }

  /**
   * Get an entity by name.
   */
  get(name: string): Entity | undefined {
    return this.entities.get(name);
  }

  /**
   * Get all entities.
   */
  getAll(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities by tag.
   */
  getByTag(tag: string): Entity[] {
    const names = this.tagIndex.get(tag);
    if (!names) return [];
    return names
      .map(name => this.entities.get(name))
      .filter((e): e is Entity => e !== undefined);
  }

  /**
   * Tag an entity for easy retrieval.
   */
  tag(entity: Entity, tag: string): void {
    if (!this.tagIndex.has(tag)) {
      this.tagIndex.set(tag, []);
    }
    this.tagIndex.get(tag)!.push(entity.getName());
  }

  /**
   * Update all active entities.
   */
  update(dt: number): void {
    for (const entity of this.entities.values()) {
      if (entity.isActive()) {
        try {
          entity.update(dt);
        } catch (e) {
          Logger.error('EntityManager', `Error updating entity "${entity.getName()}": ${e}`);
        }
      }
    }
  }

  /**
   * Remove and destroy an entity by name.
   */
  destroy(name: string): boolean {
    const entity = this.entities.get(name);
    if (!entity) {
      Logger.warn('EntityManager', `Entity "${name}" not found for destruction`);
      return false;
    }

    // Remove from tag index
    for (const [tag, names] of this.tagIndex) {
      const idx = names.indexOf(name);
      if (idx !== -1) {
        names.splice(idx, 1);
      }
    }

    entity.destroy();
    this.entities.delete(name);
    Logger.debug('EntityManager', `Entity destroyed: ${name}`);
    return true;
  }

  /**
   * Remove and destroy all entities.
   */
  clear(): void {
    for (const name of [...this.entities.keys()]) {
      this.destroy(name);
    }
    this.tagIndex.clear();
    Logger.info('EntityManager', 'All entities cleared');
  }

  /**
   * Get the total number of entities.
   */
  getCount(): number {
    return this.entities.size;
  }

  /**
   * Check if an entity exists.
   */
  has(name: string): boolean {
    return this.entities.has(name);
  }

  /**
   * Find entities within a radius of a position.
   */
  findNearby(position: THREE.Vector3, radius: number, maxResults: number = 10): Entity[] {
    const results: Entity[] = [];
    const radiusSq = radius * radius;

    for (const entity of this.entities.values()) {
      if (!entity.isActive()) continue;
      const distSq = position.distanceToSquared(entity.getPosition());
      if (distSq <= radiusSq) {
        results.push(entity);
        if (results.length >= maxResults) break;
      }
    }

    return results;
  }

  /**
   * Find the closest entity to a position.
   */
  findClosest(position: THREE.Vector3): Entity | null {
    let closest: Entity | null = null;
    let closestDist = Infinity;

    for (const entity of this.entities.values()) {
      if (!entity.isActive()) continue;
      const dist = position.distanceTo(entity.getPosition());
      if (dist < closestDist) {
        closest = entity;
        closestDist = dist;
      }
    }

    return closest;
  }

  /**
   * Dispose of all entities and the manager itself.
   */
  dispose(): void {
    this.clear();
    Logger.info('EntityManager', 'Entity manager disposed');
  }
}
