/**
 * Main game engine managing the game loop, subsystem lifecycle,
 * and overall game state.
 */
import { Logger } from '../utils/Logger.js';
import { Time } from './Time.js';
import { Input } from './Input.js';
import { Renderer } from './Renderer.js';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export interface EngineConfig {
  fixedTimestep: number;
  maxFrameTime: number;
}

export class Engine {
  private readonly time: Time;
  private readonly input: Input;
  private readonly renderer: Renderer;
  private readonly container: HTMLElement;

  private gameState: GameState = 'menu';
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private readonly fixedTimestep: number;
  private readonly maxFrameTime: number;

  // Subsystems (populated by main.ts)
  private updateables: Array<{ update(dt: number): void }> = [];
  private fixedUpdateables: Array<{ fixedUpdate(dt: number): void }> = [];
  private renderables: Array<{ render(renderer: Renderer): void }> = [];
  private destroyables: Array<{ destroy(): void }> = [];

  constructor(container: HTMLElement, config?: Partial<EngineConfig>) {
    this.container = container;
    this.fixedTimestep = config?.fixedTimestep ?? 1 / 60;
    this.maxFrameTime = config?.maxFrameTime ?? 0.1;

    this.time = new Time(this.fixedTimestep);
    this.input = new Input();
    this.renderer = new Renderer(container);

    Logger.info('Engine', 'Engine initialized');
  }

  /**
   * Start the game loop.
   */
  start(): void {
    if (this.isRunning) {
      Logger.warn('Engine', 'Engine already running');
      return;
    }

    this.isRunning = true;
    this.gameState = 'playing';
    this.lastTime = performance.now();
    this.loop(this.lastTime);

    Logger.info('Engine', 'Game loop started');
  }

  private lastTime: number = 0;

  /**
   * Main game loop using fixed timestep with variable rendering.
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    // Update time
    this.time.update(currentTime);

    // Fixed timestep updates (physics, game logic)
    let fixedSteps = 0;
    while (this.time.hasFixedStep() && fixedSteps < 5) {
      for (const obj of this.fixedUpdateables) {
        try {
          obj.fixedUpdate(this.time.getFixedDelta());
        } catch (e) {
          Logger.error('Engine', `Fixed update error: ${e}`);
        }
      }
      this.time.consumeFixedStep();
      fixedSteps++;
    }

    // Variable timestep updates (rendering, input processing)
    const dt = this.time.getDelta();
    for (const obj of this.updateables) {
      try {
        obj.update(dt);
      } catch (e) {
        Logger.error('Engine', `Update error: ${e}`);
      }
    }

    // Render
    for (const obj of this.renderables) {
      try {
        obj.render(this.renderer);
      } catch (e) {
        Logger.error('Engine', `Render error: ${e}`);
      }
    }

    this.renderer.render();

    // Process input frame state cleanup
    this.input.clearFrameStates();
  };

  /**
   * Stop the game loop.
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    Logger.info('Engine', 'Game loop stopped');
  }

  /**
   * Set game state.
   */
  setState(state: GameState): void {
    const oldState = this.gameState;
    this.gameState = state;
    Logger.info('Engine', `State changed: ${oldState} -> ${state}`);
  }

  /**
   * Get current game state.
   */
  getState(): GameState {
    return this.gameState;
  }

  /**
   * Register an object for variable timestep updates.
   */
  registerUpdateable(updatable: { update(dt: number): void }): void {
    this.updateables.push(updatable);
  }

  /**
   * Register an object for fixed timestep updates.
   */
  registerFixedUpdateable(updatable: { fixedUpdate(dt: number): void }): void {
    this.fixedUpdateables.push(updatable);
  }

  /**
   * Register an object for rendering.
   */
  registerRenderable(renderable: { render(renderer: Renderer): void }): void {
    this.renderables.push(renderable);
  }

  /**
   * Register an object for cleanup on destroy.
   */
  registerDestroyable(destroyable: { destroy(): void }): void {
    this.destroyables.push(destroyable);
  }

  /**
   * Destroy all registered systems and clean up.
   */
  destroy(): void {
    this.stop();
    for (const obj of this.destroyables) {
      try {
        obj.destroy();
      } catch (e) {
        Logger.error('Engine', `Destroy error: ${e}`);
      }
    }
    this.updateables = [];
    this.fixedUpdateables = [];
    this.renderables = [];
    this.destroyables = [];
    this.renderer.dispose();
    Logger.info('Engine', 'Engine destroyed');
  }

  /**
   * Get the Time instance.
   */
  getTime(): Time {
    return this.time;
  }

  /**
   * Get the Input instance.
   */
  getInput(): Input {
    return this.input;
  }

  /**
   * Get the Renderer instance.
   */
  getRenderer(): Renderer {
    return this.renderer;
  }

  /**
   * Get the container element.
   */
  getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Check if the game is currently running.
   */
  isGameRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get engine statistics.
   */
  getStats(): {
    fps: number;
    gameTime: string;
    triangles: number;
    drawCalls: number;
    entities: number;
  } {
    const renderStats = this.renderer.getStats();
    return {
      fps: this.time.getFPS(),
      gameTime: this.time.getFormattedTime(),
      triangles: renderStats.triangles,
      drawCalls: renderStats.drawCalls,
      entities: this.fixedUpdateables.length + this.updateables.length,
    };
  }
}
