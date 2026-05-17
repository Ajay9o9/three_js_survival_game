/**
 * Sky system managing sky color, fog, and atmospheric effects.
 */
import * as THREE from 'three';
import { Renderer } from '../core/Renderer.js';
import { Logger } from '../utils/Logger.js';

export interface SkyConfig {
  dayColorTop: number;
  dayColorBottom: number;
  nightColorTop: number;
  nightColorBottom: number;
  fogNear: number;
  fogFar: number;
}

export class Sky {
  private readonly config: SkyConfig;
  private readonly skyMesh: THREE.Mesh;
  private readonly renderer: Renderer;

  constructor(renderer: Renderer, config?: Partial<SkyConfig>) {
    this.config = {
      dayColorTop: 0x0077ff,
      dayColorBottom: 0x0099ff,
      nightColorTop: 0x000022,
      nightColorBottom: 0x000044,
      fogNear: 50,
      fogFar: 200,
      ...config,
    };

    this.renderer = renderer;

    // Create sky dome
    this.skyMesh = this.createSkyDome();
    renderer.addObject(this.skyMesh);

    Logger.info('Sky', 'Sky system initialized');
  }

  /**
   * Create a large sky dome with gradient shader.
   */
  private createSkyDome(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(500, 32, 32);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(this.config.dayColorTop) },
        bottomColor: { value: new THREE.Color(this.config.dayColorBottom) },
        offset: { value: 20 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'sky';
    mesh.frustumCulled = false; // Always render sky

    return mesh;
  }

  /**
   * Update sky colors for day/night transition.
   * @param dayFactor - 0 = night, 1 = full day
   */
  update(dayFactor: number): void {
    const material = this.skyMesh.material as THREE.ShaderMaterial;

    const topColor = new THREE.Color(this.config.dayColorTop).lerp(
      new THREE.Color(this.config.nightColorTop),
      1 - dayFactor
    );
    const bottomColor = new THREE.Color(this.config.dayColorBottom).lerp(
      new THREE.Color(this.config.nightColorBottom),
      1 - dayFactor
    );

    material.uniforms.topColor.value.copy(topColor);
    material.uniforms.bottomColor.value.copy(bottomColor);
  }

  /**
   * Set sky colors directly.
   */
  setColors(top: number, bottom: number): void {
    const material = this.skyMesh.material as THREE.ShaderMaterial;
    material.uniforms.topColor.value.setHex(top);
    material.uniforms.bottomColor.value.setHex(bottom);
  }

  /**
   * Dispose of sky resources.
   */
  dispose(): void {
    this.skyMesh.geometry.dispose();
    (this.skyMesh.material as THREE.ShaderMaterial).dispose();
  }
}
