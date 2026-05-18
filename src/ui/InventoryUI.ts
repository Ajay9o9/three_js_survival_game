/**
 * Inventory UI — full grid screen with keyboard navigation.
 * Toggled with 'I' key, shows all inventory slots.
 */
import { Inventory } from '../systems/Inventory.js';
import { ItemDefinition, getItemDefinition, ItemType } from '../systems/ItemDefinition.js';
import { HUD } from './HUD.js';
import { Logger } from '../utils/Logger.js';

/**
 * Inventory UI overlay — shows the full inventory grid.
 */
export class InventoryUI {
  private container: HTMLDivElement;
  private inventory: Inventory;
  private hud: HUD;
  private visible: boolean = false;
  private selectedSlot: number = 0;
  private hotbarSize: number = 9;

  /** DOM elements */
  private overlay!: HTMLDivElement;
  private gridContainer!: HTMLDivElement;
  private titleElement!: HTMLDivElement;

  constructor(inventory: Inventory, hud: HUD) {
    this.inventory = inventory;
    this.hud = hud;

    this.container = document.createElement('div');
    this.container.id = 'inventory-ui';
    this.container.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      pointer-events: none;
    `;

    this.buildUI();
    document.body.appendChild(this.container);

    // Listen for inventory changes
    this.inventory.onChange(() => this.updateUI());
  }

  /** Build the inventory UI DOM structure. */
  private buildUI(): void {
    const { width, height } = this.inventory.getDimensions();
    this.hotbarSize = width;

    // Title
    this.titleElement = document.createElement('div');
    this.titleElement.style.cssText = `
      color: #fff;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
      text-align: center;
    `;
    this.titleElement.textContent = 'Inventory';

    // Grid container
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${width}, 52px);
      grid-template-rows: repeat(${height}, 52px);
      gap: 4px;
      background: rgba(30, 30, 30, 0.95);
      border: 2px solid #555;
      border-radius: 8px;
      padding: 12px;
    `;

    // Create slot elements
    for (let i = 0; i < width * height; i++) {
      const slot = document.createElement('div');
      slot.id = `inv-slot-${i}`;
      slot.style.cssText = `
        width: 52px;
        height: 52px;
        background: rgba(60, 60, 60, 0.8);
        border: 2px solid #444;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        transition: border-color 0.15s;
      `;

      slot.addEventListener('click', () => {
        this.selectedSlot = i;
        this.updateUI();
      });

      this.gridContainer.appendChild(slot);
    }

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      color: #aaa;
      font-size: 12px;
      margin-top: 12px;
      text-align: center;
    `;
    instructions.innerHTML = 'Arrow keys to navigate · Click to select · Close with <b>I</b> or <b>ESC</b>';

    // Assemble
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
    `;
    this.overlay.appendChild(this.titleElement);
    this.overlay.appendChild(this.gridContainer);
    this.overlay.appendChild(instructions);

    this.container.appendChild(this.overlay);

    // Click on overlay background (not on grid) closes inventory and locks pointer
    this.container.addEventListener('click', (e: MouseEvent) => {
      // Only close if clicking on the overlay itself, not on a slot
      if (e.target === this.container) {
        this.hide();
        // Request pointer lock on the canvas after closing
        this.requestPointerLock();
      }
    });
  }

  /** Set a callback to request pointer lock on the canvas. */
  setOnPointerLock(callback: () => void): void {
    this.onPointerLock = callback;
  }

  private onPointerLock: (() => void) | null = null;

  /** Request pointer lock (calls the registered callback). */
  private requestPointerLock(): void {
    if (this.onPointerLock) {
      this.onPointerLock();
    }
  }

  /** Update the UI to reflect current inventory state. */
  private updateUI(): void {
    const slots = this.inventory.getAllSlots();
    const { width, height } = this.inventory.getDimensions();
    const totalSlots = width * height;

    for (let i = 0; i < totalSlots; i++) {
      const el = document.getElementById(`inv-slot-${i}`);
      if (!el) continue;

      const slot = slots[i];
      const def = slot.itemId ? getItemDefinition(slot.itemId) : null;

      // Highlight selected slot
      el.style.borderColor = i === this.selectedSlot ? '#ffcc00' : '#444';

      // Clear previous content
      el.innerHTML = '';

      if (slot.itemId && slot.count > 0) {
        // Item icon (emoji)
        const icon = document.createElement('span');
        icon.style.cssText = 'font-size: 24px;';
        icon.textContent = this.getItemEmoji(def!);
        el.appendChild(icon);

        // Count badge
        const count = document.createElement('span');
        count.style.cssText = `
          position: absolute;
          bottom: 2px;
          right: 4px;
          color: #fff;
          font-size: 11px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        `;
        count.textContent = slot.count > 1 ? `${slot.count}` : '';
        el.appendChild(count);

        // Tooltip on hover
        el.title = `${def?.name ?? slot.itemId}${slot.count > 1 ? ` x${slot.count}` : ''}`;
      }
    }

    // Update title
    this.titleElement.textContent = `Inventory (${this.inventory.getUsedSlots()}/${totalSlots} slots used)`;
  }

  /** Get an emoji icon for an item. */
  private getItemEmoji(def: ItemDefinition): string {
    const icons: Record<string, string> = {
      wood: '🪵', stone: '🪨', ore: '⛏️', berries: '🫐',
      plank: '📦', stone_block: '🧱',
      wooden_axe: '🪓', stone_axe: '🪓',
      wooden_pickaxe: '⛏️', stone_pickaxe: '⛏️',
      wooden_sword: '🗡️',
      wooden_wall: '🧱', wooden_floor: '🟫', stone_wall: '🪨',
    };
    return icons[def.id] || '📦';
  }

  /** Show the inventory UI. */
  show(): void {
    this.visible = true;
    this.container.style.display = 'flex';
    this.container.style.pointerEvents = 'auto';
    this.hud.hidePrompt();
    this.updateUI();
    Logger.info('InventoryUI', 'Inventory opened');
  }

  /** Hide the inventory UI. */
  hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
    this.container.style.pointerEvents = 'none';
    Logger.info('InventoryUI', 'Inventory closed');
  }

  /** Toggle the inventory UI. */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /** Handle keyboard input for inventory navigation. */
  handleKeyDown(key: string): void {
    if (!this.visible) return;

    const { width, height } = this.inventory.getDimensions();
    const totalSlots = width * height;

    switch (key) {
      case 'ArrowUp':
        this.selectedSlot = Math.max(0, this.selectedSlot - width);
        this.updateUI();
        break;
      case 'ArrowDown':
        this.selectedSlot = Math.min(totalSlots - 1, this.selectedSlot + width);
        this.updateUI();
        break;
      case 'ArrowLeft':
        this.selectedSlot = Math.max(0, this.selectedSlot - 1);
        this.updateUI();
        break;
      case 'ArrowRight':
        this.selectedSlot = Math.min(totalSlots - 1, this.selectedSlot + 1);
        this.updateUI();
        break;
      case 'Escape':
      case 'KeyI':
        this.hide();
        break;
    }
  }

  /** Clean up DOM elements. */
  destroy(): void {
    this.container.remove();
  }
}
