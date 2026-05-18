/**
 * Input handling system for keyboard and mouse.
 * Provides action-based input with key bindings.
 */
import { Logger } from '../utils/Logger.js';

export interface KeyBinding {
  keys: string[];
  action: string;
}

export class Input {
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private mousePrevious: { x: number; y: number } = { x: 0, y: 0 };
  private mouseButtonsDown: Set<number> = new Set();
  private mouseButtonsJustPressed: Set<number> = new Set();
  private mouseButtonsJustReleased: Set<number> = new Set();
  private actionMap: Map<string, string[]> = new Map();
  private pointerLocked: boolean = false;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

  constructor() {
    this.setupDefaultBindings();
    this.setupEventListeners();
  }

  /**
   * Set up default key bindings for game actions.
   */
  private setupDefaultBindings(): void {
    const bindings: KeyBinding[] = [
      { keys: ['KeyW'], action: 'moveForward' },
      { keys: ['KeyS'], action: 'moveBackward' },
      { keys: ['KeyA'], action: 'moveLeft' },
      { keys: ['KeyD'], action: 'moveRight' },
      { keys: ['ShiftLeft', 'ShiftRight'], action: 'sprint' },
      { keys: ['Space'], action: 'jump' },
      { keys: ['KeyE'], action: 'interact' },
      { keys: ['KeyI'], action: 'inventory' },
      { keys: ['KeyC'], action: 'crafting' },
      { keys: ['KeyR'], action: 'reload' },
      { keys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'], action: 'hotbar' },
      { keys: ['KeyP'], action: 'pause' },
      { keys: ['Escape'], action: 'menu' },
    ];

    for (const binding of bindings) {
      this.actionMap.set(binding.action, binding.keys);
    }
  }

  /**
   * Set up DOM event listeners for keyboard and mouse.
   */
  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      e.preventDefault();
      this.keysDown.add(e.code);
      this.keysJustPressed.add(e.code);
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      e.preventDefault();
      this.keysDown.delete(e.code);
      this.keysJustReleased.add(e.code);
    });

    // Mouse movement (attached to canvas when pointer lock is active)
    // We do NOT attach a window-level listener because pointer-locked
    // mouse events only fire on the locked element and movementX/Y are
    // not reliably available on events that bubble to window.

    // Mouse button events
    window.addEventListener('mousedown', (e: MouseEvent) => {
      this.mouseButtonsDown.add(e.button);
      this.mouseButtonsJustPressed.add(e.button);
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      this.mouseButtonsDown.delete(e.button);
      this.mouseButtonsJustReleased.add(e.button);
    });

    // Pointer lock
    window.addEventListener('pointerlockchange', () => {
      const wasLocked = this.pointerLocked;
      this.pointerLocked = document.pointerLockElement !== null;

      // Remove mousemove listener when pointer lock is released
      if (wasLocked && !this.pointerLocked && this.mouseMoveHandler) {
        const oldTarget = document.querySelector('canvas') as HTMLCanvasElement | null;
        if (oldTarget) {
          oldTarget.removeEventListener('mousemove', this.mouseMoveHandler);
        }
      }
    });

    Logger.info('Input', 'Input system initialized with default bindings');
  }

  /**
   * Check if a specific key is currently held down.
   */
  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  /**
   * Check if a specific key was just pressed this frame.
   */
  isKeyJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  /**
   * Check if a specific key was just released this frame.
   */
  isKeyJustReleased(code: string): boolean {
    return this.keysJustReleased.has(code);
  }

  /**
   * Check if a game action is currently active.
   */
  isActionActive(action: string): boolean {
    const keys = this.actionMap.get(action);
    if (!keys) return false;
    return keys.some(key => this.keysDown.has(key));
  }

  /**
   * Check if a game action was just activated this frame.
   */
  isActionJustPressed(action: string): boolean {
    const keys = this.actionMap.get(action);
    if (!keys) return false;
    return keys.some(key => this.keysJustPressed.has(key));
  }

  /**
   * Check if a mouse button is currently held down.
   */
  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtonsDown.has(button);
  }

  /**
   * Check if a mouse button was just pressed this frame.
   */
  isMouseButtonJustPressed(button: number): boolean {
    return this.mouseButtonsJustPressed.has(button);
  }

  /**
   * Check if a mouse button was just released this frame.
   */
  isMouseButtonJustReleased(button: number): boolean {
    return this.mouseButtonsJustReleased.has(button);
  }

  /**
   * Get the current mouse position in screen coordinates.
   */
  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  /**
   * Get the mouse delta (movement since last frame).
   */
  getMouseDelta(): { x: number; y: number } {
    return { ...this.mouseDelta };
  }

  /**
   * Check if the pointer is currently locked.
   */
  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  /**
   * Request pointer lock for FPS-style mouse control.
   * @param canvas - Optional canvas element; falls back to first <canvas> in DOM.
   */
  requestPointerLock(canvas?: HTMLCanvasElement): void {
    const target = canvas ?? (document.querySelector('canvas') as HTMLCanvasElement | null);
    if (!target) return;

    // Attach mousemove listener to the locked element so we capture movementX/Y
    if (!this.mouseMoveHandler) {
      this.mouseMoveHandler = (e: MouseEvent) => {
        this.mousePrevious.x = this.mousePosition.x;
        this.mousePrevious.y = this.mousePosition.y;
        this.mousePosition.x = e.clientX;
        this.mousePosition.y = e.clientY;
        this.mouseDelta.x = e.movementX || 0;
        this.mouseDelta.y = e.movementY || 0;
      };
    }
    target.addEventListener('mousemove', this.mouseMoveHandler);
    target.requestPointerLock();
  }

  /**
   * Release pointer lock.
   */
  releasePointerLock(): void {
    // Remove mousemove listener
    if (this.mouseMoveHandler) {
      const oldTarget = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (oldTarget) {
        oldTarget.removeEventListener('mousemove', this.mouseMoveHandler);
      }
      this.mouseMoveHandler = null;
    }
    document.exitPointerLock();
  }

  /**
   * Clear just-pressed/just-released states.
   * Call at the end of each frame.
   */
  clearFrameStates(): void {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseButtonsJustReleased.clear();
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }

  /**
   * Add a custom key binding.
   */
  addBinding(action: string, keys: string[]): void {
    this.actionMap.set(action, keys);
  }

  /**
   * Get all currently active actions.
   */
  getActiveActions(): string[] {
    const active: string[] = [];
    for (const [action, keys] of this.actionMap) {
      if (keys.some(key => this.keysDown.has(key))) {
        active.push(action);
      }
    }
    return active;
  }
}
