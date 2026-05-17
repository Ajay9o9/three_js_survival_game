/**
 * Three.js renderer wrapper providing scene management,
 * camera setup, and rendering pipeline.
 */
import * as THREE from 'three';
import { Logger } from '../utils/Logger.js';

export interface RendererConfig {
  antialias: boolean;
  shadowMap: boolean;
  pixelRatio: number;
  fogNear: number;
  fogFar: number;
  fogColor: number;
  skyColor: number;
}

export class Renderer {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  private readonly config: RendererConfig;
  private resizeHandler: (() => void) | null = null;

  constructor(container: HTMLElement, config?: Partial<RendererConfig>) {
    this.config = {
      antialias: true,
      shadowMap: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      fogNear: 50,
      fogFar: 200,
      fogColor: 0x87CEEB,
      skyColor: 0x87CEEB,
      ...config,
    };

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.skyColor);
    this.scene.fog = new THREE.Fog(this.config.fogColor, this.config.fogNear, this.config.fogFar);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.config.pixelRatio);
    this.renderer.shadowMap.enabled = this.config.shadowMap;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Append renderer to container
    container.appendChild(this.renderer.domElement);

    // Setup resize handler
    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);

    Logger.info('Renderer', `Renderer initialized: ${this.renderer.info.render.triangles} triangles capacity`);
  }

  /**
   * Handle window resize.
   */
  private onResize(): void {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Render the current scene with the current camera.
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Set the camera target (look-at point).
   */
  setCameraTarget(target: THREE.Vector3): void {
    this.camera.lookAt(target);
  }

  /**
   * Add an object to the scene.
   */
  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene.
   */
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Clear all objects from the scene.
   */
  clear(): void {
    // Remove all children from scene
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);
      // Dispose geometries and materials
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }

  /**
   * Dispose of all renderer resources.
   */
  dispose(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.renderer.dispose();
    const container = this.renderer.domElement.parentElement;
    if (container) {
      container.removeChild(this.renderer.domElement);
    }
  }

  /**
   * Get the renderer's DOM element.
   */
  getDOMElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * Update fog settings.
   */
  setFog(near: number, far: number, color: number): void {
    const fog = this.scene.fog;
    if (fog && fog instanceof THREE.Fog) {
      fog.near = near;
      fog.far = far;
      fog.color.setHex(color);
    }
  }

  /**
   * Update sky/background color.
   */
  setSkyColor(color: number): void {
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(color);
    }
    const fog = this.scene.fog;
    if (fog && fog instanceof THREE.Fog) {
      fog.color.setHex(color);
    }
  }

  /**
   * Get current render statistics.
   */
  getStats(): { triangles: number; drawCalls: number; textures: number; geometries: number } {
    const info = this.renderer.info;
    return {
      triangles: info.render.triangles,
      drawCalls: info.render.calls,
      textures: info.memory.textures,
      geometries: info.memory.geometries,
    };
  }
}
