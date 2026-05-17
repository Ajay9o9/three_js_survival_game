/**
 * Heads-up display system for rendering game UI overlays.
 * Displays health, hunger, stamina bars, hotbar, and crosshair.
 */
import { Logger } from '../utils/Logger.js';

export interface HUDConfig {
  barWidth: number;
  barHeight: number;
  barGap: number;
  barY: number;
  barX: number;
  crosshairSize: number;
  hotbarSlotSize: number;
  hotbarSlotGap: number;
  hotbarY: number;
}

export class HUD {
  private readonly container: HTMLElement;
  private readonly config: HUDConfig;
  private elements: Record<string, HTMLElement> = {};
  private visible: boolean = true;

  constructor(container: HTMLElement, config?: Partial<HUDConfig>) {
    this.container = container;
    this.config = {
      barWidth: 200,
      barHeight: 16,
      barGap: 4,
      barX: 20,
      barY: 20,
      crosshairSize: 12,
      hotbarSlotSize: 48,
      hotbarSlotGap: 4,
      hotbarY: window.innerHeight - 60,
      ...config,
    };

    this.createElements();
    Logger.info('HUD', 'HUD system initialized');
  }

  /**
   * Create all HUD DOM elements.
   */
  private createElements(): void {
    // Create main HUD container
    const hudContainer = document.createElement('div');
    hudContainer.id = 'hud-container';
    hudContainer.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 10;
    `;

    // Crosshair
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: ${this.config.crosshairSize}px;
      height: ${this.config.crosshairSize}px;
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      box-sizing: border-box;
    `;
    hudContainer.appendChild(crosshair);
    this.elements.crosshair = crosshair;

    // Stats bars container
    const statsContainer = document.createElement('div');
    statsContainer.id = 'stats-bars';
    statsContainer.style.cssText = `
      position: absolute;
      top: ${this.config.barY}px;
      left: ${this.config.barX}px;
      display: flex;
      flex-direction: column;
      gap: ${this.config.barGap}px;
    `;

    // Health bar
    statsContainer.appendChild(this.createBar('health', '#cc3333', '#ff6666', '❤'));
    // Hunger bar
    statsContainer.appendChild(this.createBar('hunger', '#cc8833', '#ffaa44', '🍖'));
    // Stamina bar
    statsContainer.appendChild(this.createBar('stamina', '#3388cc', '#66aaff', '⚡'));

    hudContainer.appendChild(statsContainer);
    this.elements.statsBars = statsContainer;

    // Hotbar container
    const hotbarContainer = document.createElement('div');
    hotbarContainer.id = 'hotbar';
    hotbarContainer.style.cssText = `
      position: absolute;
      bottom: ${window.innerHeight - this.config.hotbarY - 30}px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: ${this.config.hotbarSlotGap}px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
    `;

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.id = `hotbar-slot-${i}`;
      slot.style.cssText = `
        width: ${this.config.hotbarSlotSize}px;
        height: ${this.config.hotbarSlotSize}px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-family: monospace;
        position: relative;
      `;

      // Slot number
      const num = document.createElement('span');
      num.style.cssText = 'position: absolute; top: 2px; left: 4px; font-size: 9px; opacity: 0.5;';
      num.textContent = (i + 1).toString();
      slot.appendChild(num);

      // Item display
      const itemDisplay = document.createElement('span');
      itemDisplay.id = `hotbar-item-${i}`;
      itemDisplay.style.cssText = 'font-size: 20px;';
      slot.appendChild(itemDisplay);

      // Item count
      const countDisplay = document.createElement('span');
      countDisplay.id = `hotbar-count-${i}`;
      countDisplay.style.cssText = 'position: absolute; bottom: 2px; right: 4px; font-size: 10px; opacity: 0.8;';
      slot.appendChild(countDisplay);

      hotbarContainer.appendChild(slot);
    }

    hudContainer.appendChild(hotbarContainer);
    this.elements.hotbar = hotbarContainer;

    // Interaction prompt
    const prompt = document.createElement('div');
    prompt.id = 'interaction-prompt';
    prompt.style.cssText = `
      position: absolute;
      bottom: ${this.config.hotbarY + 50}px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
      font-family: 'Segoe UI', sans-serif;
      background: rgba(0, 0, 0, 0.6);
      padding: 6px 16px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      white-space: nowrap;
    `;
    prompt.textContent = '[E] Interact';
    hudContainer.appendChild(prompt);
    this.elements.prompt = prompt;

    // Interaction progress bar
    const progressContainer = document.createElement('div');
    progressContainer.id = 'gather-progress';
    progressContainer.style.cssText = `
      position: absolute;
      bottom: ${this.config.hotbarY + 75}px;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 6px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 3px;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    const progressBar = document.createElement('div');
    progressBar.id = 'gather-progress-bar';
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      border-radius: 3px;
      transition: width 0.1s linear;
    `;
    progressContainer.appendChild(progressBar);
    hudContainer.appendChild(progressContainer);
    this.elements.gatherProgress = progressContainer;
    this.elements.gatherProgressBar = progressBar;

    this.container.appendChild(hudContainer);
  }

  /**
   * Create a stat bar element.
   */
  private createBar(id: string, color: string, lightColor: string, icon: string): HTMLElement {
    const bar = document.createElement('div');
    bar.id = `bar-${id}`;
    bar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Icon
    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = `
      font-size: 14px;
      width: 20px;
      text-align: center;
    `;
    iconSpan.textContent = icon;

    // Background
    const bg = document.createElement('div');
    bg.style.cssText = `
      width: ${this.config.barWidth}px;
      height: ${this.config.barHeight}px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Fill
    const fill = document.createElement('div');
    fill.id = `bar-fill-${id}`;
    fill.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, ${lightColor}, ${color});
      border-radius: 2px;
      transition: width 0.2s ease;
    `;

    // Value text
    const valueText = document.createElement('span');
    valueText.id = `bar-value-${id}`;
    valueText.style.cssText = `
      font-size: 11px;
      color: white;
      font-family: monospace;
      min-width: 40px;
      text-align: right;
    `;
    valueText.textContent = '100/100';

    bg.appendChild(fill);
    bar.appendChild(iconSpan);
    bar.appendChild(bg);
    bar.appendChild(valueText);

    this.elements[`fill-${id}`] = fill;
    this.elements[`value-${id}`] = valueText;

    return bar;
  }

  /**
   * Update health bar.
   */
  updateHealth(health: number, maxHealth: number): void {
    const fill = this.elements[`fill-health`];
    const value = this.elements[`value-health`];
    if (fill) fill.style.width = `${(health / maxHealth) * 100}%`;
    if (value) value.textContent = `${Math.round(health)}/${maxHealth}`;
  }

  /**
   * Update hunger bar.
   */
  updateHunger(hunger: number, maxHunger: number): void {
    const fill = this.elements[`fill-hunger`];
    const value = this.elements[`value-hunger`];
    if (fill) fill.style.width = `${(hunger / maxHunger) * 100}%`;
    if (value) value.textContent = `${Math.round(hunger)}/${maxHunger}`;
  }

  /**
   * Update stamina bar.
   */
  updateStamina(stamina: number, maxStamina: number): void {
    const fill = this.elements[`fill-stamina`];
    const value = this.elements[`value-stamina`];
    if (fill) fill.style.width = `${(stamina / maxStamina) * 100}%`;
    if (value) value.textContent = `${Math.round(stamina)}/${maxStamina}`;
  }

  /**
   * Update hotbar display.
   */
  updateHotbar(slots: Array<{ itemId: string | null; count: number }>): void {
    for (let i = 0; i < 9; i++) {
      const itemDisplay = this.elements[`hotbar-item-${i}`] as HTMLElement;
      const countDisplay = this.elements[`hotbar-count-${i}`] as HTMLElement;
      const slot = this.elements[`hotbar-slot-${i}`] as HTMLElement;

      if (!itemDisplay || !countDisplay || !slot) continue;

      const slotData = slots[i];
      if (slotData && slotData.itemId && slotData.count > 0) {
        // Simple icon mapping
        const icons: Record<string, string> = {
          wood: '🪵', stone: '🪨', ore: '💎', berries: '🫐',
          plank: '📦', stone_block: '🧱',
          wooden_axe: '🪓', stone_axe: '🪓',
          wooden_pickaxe: '⛏️', stone_pickaxe: '⛏️',
          wooden_sword: '🗡️',
          wooden_wall: '🧱', wooden_floor: '🟫', stone_wall: '🏛️',
        };
        itemDisplay.textContent = icons[slotData.itemId] ?? '?';
        countDisplay.textContent = slotData.count > 1 ? slotData.count.toString() : '';
        slot.style.borderColor = 'rgba(255, 255, 100, 0.6)';
      } else {
        itemDisplay.textContent = '';
        countDisplay.textContent = '';
        slot.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }
    }
  }

  /**
   * Show interaction prompt.
   */
  showPrompt(text: string): void {
    const prompt = this.elements.prompt as HTMLElement;
    if (prompt) {
      prompt.textContent = text;
      prompt.style.opacity = '1';
    }
  }

  /**
   * Hide interaction prompt.
   */
  hidePrompt(): void {
    const prompt = this.elements.prompt as HTMLElement;
    if (prompt) {
      prompt.style.opacity = '0';
    }
  }

  /**
   * Show gather progress.
   */
  showGatherProgress(progress: number): void {
    const container = this.elements.gatherProgress as HTMLElement;
    const bar = this.elements.gatherProgressBar as HTMLElement;
    if (container) container.style.opacity = '1';
    if (bar) bar.style.width = `${progress * 100}%`;
  }

  /**
   * Hide gather progress.
   */
  hideGatherProgress(): void {
    const container = this.elements.gatherProgress as HTMLElement;
    if (container) container.style.opacity = '0';
  }

  /**
   * Highlight a hotbar slot.
   */
  highlightSlot(index: number): void {
    for (let i = 0; i < 9; i++) {
      const slot = this.elements[`hotbar-slot-${i}`] as HTMLElement;
      if (slot) {
        slot.style.borderColor = i === index
          ? 'rgba(255, 255, 100, 0.9)'
          : 'rgba(255, 255, 255, 0.3)';
      }
    }
  }

  /**
   * Toggle HUD visibility.
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    const hudContainer = this.container.querySelector('#hud-container');
    if (hudContainer) {
      (hudContainer as HTMLElement).style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Get HUD visibility state.
   */
  getVisible(): boolean {
    return this.visible;
  }

  /**
   * Update hotbar with inventory data.
   */
  updateFromInventory(slots: Array<{ itemId: string | null; count: number }>): void {
    this.updateHotbar(slots);
  }
}
