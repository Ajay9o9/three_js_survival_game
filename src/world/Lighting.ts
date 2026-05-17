/**
 * Lighting system managing ambient, directional, and hemisphere lights.
 * Supports day/night cycle integration.
 */
import * as THREE from 'three';
import { Renderer } from '../core/Renderer.js';
import { Logger } from '../utils/Logger.js';

export interface LightingConfig {
  ambientIntensity: number;
  ambientColor: number;
  sunIntensity: number;
  sunColor: number;
  sunPosition: { x: number; y: number; z: number };
  hemisphereSkyColor: number;
  hemisphereGroundColor: number;
  hemisphereIntensity: number;
}

export class Lighting {
  private readonly ambientLight: THREE.AmbientLight;
  private readonly directionalLight: THREE.DirectionalLight;
  private readonly hemisphereLight: THREE.HemisphereLight;
  private readonly config: LightingConfig;

  constructor(config?: Partial<LightingConfig>) {
    this.config = {
      ambientIntensity: 0.4,
      ambientColor: 0xffffff,
      sunIntensity: 1.2,
      sunColor: 0xfff4e0,
      sunPosition: { x: 50, y: 80, z: 30 },
      hemisphereSkyColor: 0x87CEEB,
      hemisphereGroundColor: 0x3a5f0b,
      hemisphereIntensity: 0.6,
      ...config,
    };

    // Ambient light (base illumination)
    this.ambientLight = new THREE.AmbientLight(
      this.config.ambientColor,
      this.config.ambientIntensity
    );
    this.ambientLight.name = 'ambientLight';

    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(
      this.config.sunColor,
      this.config.sunIntensity
    );
    this.directionalLight.position.set(
      this.config.sunPosition.x,
      this.config.sunPosition.y,
      this.config.sunPosition.z
    );
    this.directionalLight.castShadow = true;

    // Configure shadow properties
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -60;
    this.directionalLight.shadow.camera.right = 60;
    this.directionalLight.shadow.camera.top = 60;
    this.directionalLight.shadow.camera.bottom = -60;
    this.directionalLight.shadow.bias = -0.001;
    this.directionalLight.shadow.normalBias = 0.02;
    this.directionalLight.name = 'sunLight';

    // Hemisphere light (sky/ground color blend)
    this.hemisphereLight = new THREE.HemisphereLight(
      this.config.hemisphereSkyColor,
      this.config.hemisphereGroundColor,
      this.config.hemisphereIntensity
    );
    this.hemisphereLight.name = 'hemisphereLight';

    Logger.info('Lighting', 'Lighting system initialized');
  }

  /**
   * Add all lights to the renderer's scene.
   */
  addToRenderer(renderer: Renderer): void {
    renderer.scene.add(this.ambientLight);
    renderer.scene.add(this.directionalLight);
    renderer.scene.add(this.hemisphereLight);
  }

  /**
   * Remove all lights from the scene.
   */
  removeFromRenderer(renderer: Renderer): void {
    renderer.scene.remove(this.ambientLight);
    renderer.scene.remove(this.directionalLight);
    renderer.scene.remove(this.hemisphereLight);
  }

  /**
   * Update sun position and intensity for day/night cycle.
   * @param angle - Sun angle in radians (0 = noon, PI = midnight)
   * @param dayLength - Total day length in seconds (default: 600 = 10 min day)
   * @param renderer - Optional renderer reference for sky/fog updates
   */
  updateDayNight(angle: number, dayLength: number = 600, renderer?: Renderer): void {
    const dayProgress = (angle % (Math.PI * 2)) / (Math.PI * 2);
    const isDaytime = dayProgress < 0.5;

    // Sun position follows a semi-circle arc
    const sunHeight = Math.sin(angle);
    const sunHorizontal = Math.cos(angle);

    this.directionalLight.position.set(
      sunHorizontal * 80,
      Math.max(sunHeight * 80, -10),
      30
    );

    // Day/night intensity transition
    const dayFactor = Math.max(0, Math.sin(angle));
    const nightFactor = Math.max(0, -Math.sin(angle));

    // Sun intensity based on angle
    this.directionalLight.intensity = dayFactor * 1.5;

    // Ambient light dims at night
    this.ambientLight.intensity = 0.15 + dayFactor * 0.35;

    // Hemisphere intensity follows day
    this.hemisphereLight.intensity = 0.1 + dayFactor * 0.6;

    // Sun color shifts at dawn/dusk
    if (dayFactor > 0.1 && dayFactor < 0.5) {
      // Dawn/dusk - warm orange
      this.directionalLight.color.setHex(0xffa040);
    } else if (dayFactor >= 0.5) {
      // Midday - white
      this.directionalLight.color.setHex(0xfff4e0);
    } else {
      // Night - blue moonlight
      this.directionalLight.color.setHex(0x4466aa);
    }

    // Sky color transitions
    if (renderer) {
      const skyR = 0.1 + dayFactor * 0.43;
      const skyG = 0.1 + dayFactor * 0.71;
      const skyB = 0.15 + dayFactor * 0.82;
      renderer.setSkyColor(new THREE.Color(skyR, skyG, skyB).getHex());

      // Fog color follows sky
      renderer.setFog(
        50,
        200,
        new THREE.Color(skyR * 0.8, skyG * 0.8, skyB * 0.8).getHex()
      );
    }
  }

  /**
   * Get the directional light (sun).
   */
  getSunLight(): THREE.DirectionalLight {
    return this.directionalLight;
  }

  /**
   * Get the ambient light.
   */
  getAmbientLight(): THREE.AmbientLight {
    return this.ambientLight;
  }

  /**
   * Get the hemisphere light.
   */
  getHemisphereLight(): THREE.HemisphereLight {
    return this.hemisphereLight;
  }

  /**
   * Dispose of lighting resources.
   */
  dispose(): void {
    this.ambientLight.dispose();
    this.directionalLight.dispose();
    this.hemisphereLight.dispose();
  }
}
