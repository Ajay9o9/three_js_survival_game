/**
 * Terrain generation system.
 * Creates a procedural grid-based terrain with varied ground colors.
 */
import * as THREE from 'three';
import { Renderer } from '../core/Renderer.js';
import { Logger } from '../utils/Logger.js';

export interface TerrainConfig {
  worldSize: number;
  gridSize: number;
  tileSize: number;
  heightAmplitude: number;
  seed: number;
}

export class Terrain {
  private readonly config: TerrainConfig;
  private readonly mesh: THREE.Mesh;
  private readonly heightData: Float32Array;
  private readonly size: number;
  private readonly divisions: number;

  constructor(config?: Partial<TerrainConfig>) {
    this.config = {
      worldSize: 200,
      gridSize: 100,
      tileSize: 2,
      heightAmplitude: 3,
      seed: 42,
      ...config,
    };

    this.size = this.config.worldSize;
    this.divisions = this.config.gridSize;

    // Generate height data
    this.heightData = this.generateHeightData();

    // Create terrain mesh
    this.mesh = this.createTerrainMesh();

    Logger.info('Terrain', `Terrain created: ${this.size}x${this.size}, ${this.divisions} divisions`);
  }

  /**
   * Simple seeded pseudo-random number generator.
   */
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /**
   * Generate height data for the terrain using simple noise.
   */
  private generateHeightData(): Float32Array {
    const size = this.divisions + 1;
    const data = new Float32Array(size * size);
    const rand = this.seededRandom(this.config.seed);

    // Simple multi-octave noise
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / this.divisions;
        const ny = y / this.divisions;

        // Combine multiple sine waves for terrain variation
        let height = 0;
        height += Math.sin(nx * 6.28 * 2 + ny * 3.14) * 0.5;
        height += Math.sin(nx * 3.14 * 4 - ny * 6.28) * 0.25;
        height += Math.sin(nx * 12.56 + ny * 9.42) * 0.125;
        height += (rand() - 0.5) * 0.1; // Random noise

        data[y * size + x] = height * this.config.heightAmplitude;
      }
    }

    return data;
  }

  /**
   * Get height at a specific world position.
   */
  getHeight(x: number, z: number): number {
    const size = this.divisions + 1;
    const cellSize = this.size / this.divisions;

    // Convert world position to grid coordinates
    const gx = ((x + this.size / 2) / cellSize);
    const gz = ((z + this.size / 2) / cellSize);

    // Clamp to valid range
    const ix = Math.max(0, Math.min(this.divisions, Math.floor(gx)));
    const iz = Math.max(0, Math.min(this.divisions, Math.floor(gz)));

    // Bilinear interpolation
    const fx = gx - Math.floor(gx);
    const fz = gz - Math.floor(gz);

    const h00 = this.heightData[iz * size + ix];
    const h10 = this.heightData[iz * size + Math.min(ix + 1, this.divisions)];
    const h01 = this.heightData[Math.min(iz + 1, this.divisions) * size + ix];
    const h11 = this.heightData[Math.min(iz + 1, this.divisions) * size + Math.min(ix + 1, this.divisions)];

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  }

  /**
   * Create the terrain mesh with height variation.
   */
  private createTerrainMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.divisions,
      this.divisions
    );
    geometry.rotateX(-Math.PI / 2);

    // Apply height data to vertices
    const positions = geometry.attributes.position.array as Float32Array;
    const size = this.divisions + 1;

    for (let i = 0; i < size * size; i++) {
      positions[i * 3 + 1] = this.heightData[i];
    }

    geometry.computeVertexNormals();

    // Create vertex colors for terrain variation
    const colors = new Float32Array(size * size * 3);
    const rand = this.seededRandom(this.config.seed + 100);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 3;
        const height = this.heightData[y * size + x];

        // Color based on height: low = dark green, mid = grass green, high = brown/gray
        if (height < -1) {
          // Low areas - darker green
          colors[idx] = 0.15 + rand() * 0.05;
          colors[idx + 1] = 0.35 + rand() * 0.1;
          colors[idx + 2] = 0.1 + rand() * 0.05;
        } else if (height < 1) {
          // Mid areas - grass green
          colors[idx] = 0.2 + rand() * 0.1;
          colors[idx + 1] = 0.55 + rand() * 0.15;
          colors[idx + 2] = 0.15 + rand() * 0.05;
        } else {
          // High areas - brown/gray
          colors[idx] = 0.4 + rand() * 0.1;
          colors[idx + 1] = 0.35 + rand() * 0.1;
          colors[idx + 2] = 0.25 + rand() * 0.05;
        }
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.name = 'terrain';

    return mesh;
  }

  /**
   * Get the terrain mesh for adding to the scene.
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Get the world size.
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get the half world size.
   */
  getHalfSize(): number {
    return this.size / 2;
  }

  /**
   * Check if a position is within the world bounds.
   */
  isInBounds(x: number, z: number): boolean {
    const half = this.size / 2;
    return x >= -half && x <= half && z >= -half && z <= half;
  }

  /**
   * Clamp a position to world bounds.
   */
  clampToWorld(x: number, z: number): { x: number; z: number } {
    const half = this.size / 2;
    return {
      x: Math.max(-half, Math.min(half, x)),
      z: Math.max(-half, Math.min(half, z)),
    };
  }

  /**
   * Dispose of terrain resources.
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
