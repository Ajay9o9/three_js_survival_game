/**
 * Time management system providing delta time, fixed timestep,
 * and game time tracking.
 */
import { Logger } from '../utils/Logger.js';

export class Time {
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private fixedDeltaTime: number = 1 / 60;
  private accumulator: number = 0;
  private gameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsTimer: number = 0;

  constructor(fixedDeltaTime: number = 1 / 60) {
    this.fixedDeltaTime = fixedDeltaTime;
  }

  /**
   * Update time tracking. Call once per frame with current timestamp.
   */
  update(currentTime: number): void {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      this.deltaTime = 0;
      return;
    }

    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;
    this.gameTime += this.deltaTime;
    this.accumulator += this.deltaTime;
    this.frameCount++;

    // FPS calculation (update every second)
    this.fpsTimer += this.deltaTime;
    if (this.fpsTimer >= 1.0) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  /**
   * Get the current delta time in seconds.
   */
  getDelta(): number {
    return this.deltaTime;
  }

  /**
   * Get the fixed timestep value.
   */
  getFixedDelta(): number {
    return this.fixedDeltaTime;
  }

  /**
   * Advance the accumulator by fixed timestep. Returns true if a fixed step is ready.
   */
  hasFixedStep(): boolean {
    return this.accumulator >= this.fixedDeltaTime;
  }

  /**
   * Consume one fixed timestep from the accumulator.
   */
  consumeFixedStep(): void {
    this.accumulator -= this.fixedDeltaTime;
  }

  /**
   * Get the total game time in seconds.
   */
  getGameTime(): number {
    return this.gameTime;
  }

  /**
   * Get the current FPS.
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get the current frame count since last FPS update.
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Reset time tracking (useful for pause/resume).
   */
  reset(): void {
    this.lastTime = 0;
    this.deltaTime = 0;
    this.accumulator = 0;
    this.gameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsTimer = 0;
  }

  /**
   * Get a formatted time string (mm:ss.ms).
   */
  getFormattedTime(): string {
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    const ms = Math.floor((this.gameTime % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
}
