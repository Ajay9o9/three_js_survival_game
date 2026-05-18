/**
 * Inventory system with grid-based slots, item stacking,
 * and serialization for save/load.
 */
import { ItemDefinition, getItemDefinition } from './ItemDefinition.js';
import { Logger } from '../utils/Logger.js';

export interface InventorySlot {
  itemId: string | null;
  count: number;
  /** Optional metadata (e.g., tool durability). */
  metadata?: Record<string, unknown>;
}

export interface InventoryConfig {
  width: number;
  height: number;
}

export class Inventory {
  private readonly slots: InventorySlot[];
  private readonly width: number;
  private readonly height: number;
  private readonly totalSlots: number;
  private readonly name: string;
  private onChangeCallbacks: Array<() => void> = [];

  constructor(config: Partial<InventoryConfig> = {}, name: string = 'inventory') {
    this.width = config.width ?? 9;
    this.height = config.height ?? 3;
    this.totalSlots = this.width * this.height;
    this.name = name;
    this.slots = Array.from({ length: this.totalSlots }, () => ({
      itemId: null,
      count: 0,
    }));

    Logger.info('Inventory', `${name} created: ${this.width}x${this.height} (${this.totalSlots} slots)`);
  }

  /**
   * Get the number of slots.
   */
  getTotalSlots(): number {
    return this.totalSlots;
  }

  /**
   * Get the inventory dimensions.
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get a slot by index.
   */
  getSlot(index: number): InventorySlot {
    if (index < 0 || index >= this.totalSlots) {
      Logger.warn('Inventory', `Invalid slot index: ${index}`);
      return { itemId: null, count: 0 };
    }
    return { ...this.slots[index] };
  }

  /**
   * Get all slots.
   */
  getAllSlots(): InventorySlot[] {
    return this.slots.map(slot => ({ ...slot }));
  }

  /**
   * Set a slot's contents.
   */
  setSlot(index: number, itemId: string | null, count: number): boolean {
    if (index < 0 || index >= this.totalSlots) {
      Logger.warn('Inventory', `Invalid slot index: ${index}`);
      return false;
    }

    if (itemId === null || count <= 0) {
      this.slots[index] = { itemId: null, count: 0 };
      this.notifyChange();
      return true;
    }

    const def = getItemDefinition(itemId);
    if (!def) {
      Logger.warn('Inventory', `Unknown item ID: ${itemId}`);
      return false;
    }

    this.slots[index] = { itemId, count: Math.min(count, def.stackSize) };
    this.notifyChange();
    return true;
  }

  /**
   * Add items to the inventory. Returns remaining count if full.
   */
  addItem(itemId: string, count: number): number {
    const def = getItemDefinition(itemId);
    if (!def) {
      Logger.warn('Inventory', `Unknown item ID: ${itemId}`);
      return count;
    }

    let remaining = count;

    // First, try to stack into existing slots of the same item
    for (let i = 0; i < this.totalSlots && remaining > 0; i++) {
      const slot = this.slots[i];
      if (slot.itemId === itemId && slot.count < def.stackSize) {
        const space = def.stackSize - slot.count;
        const add = Math.min(space, remaining);
        slot.count += add;
        remaining -= add;
      }
    }

    // Then, find empty slots for remaining items
    while (remaining > 0) {
      let foundEmpty = false;
      for (let i = 0; i < this.totalSlots && remaining > 0; i++) {
        const slot = this.slots[i];
        if (slot.itemId === null) {
          const add = Math.min(remaining, def.stackSize);
          slot.itemId = itemId;
          slot.count = add;
          remaining -= add;
          foundEmpty = true;
        }
      }
      if (!foundEmpty) break;
    }

    if (remaining < count) {
      this.notifyChange();
    }

    return remaining;
  }

  /**
   * Remove items from the inventory. Returns true if all were removed.
   */
  removeItem(itemId: string, count: number): boolean {
    let remaining = count;

    for (let i = 0; i < this.totalSlots && remaining > 0; i++) {
      const slot = this.slots[i];
      if (slot.itemId === itemId) {
        const remove = Math.min(slot.count, remaining);
        slot.count -= remove;
        remaining -= remove;
        if (slot.count <= 0) {
          slot.itemId = null;
          slot.count = 0;
        }
      }
    }

    if (remaining < count) {
      this.notifyChange();
    }

    return remaining <= 0;
  }

  /**
   * Check if the inventory contains at least count of an item.
   */
  hasItem(itemId: string, count: number = 1): boolean {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.itemId === itemId) {
        total += slot.count;
      }
    }
    return total >= count;
  }

  /**
   * Get the total count of an item across all slots.
   */
  getItemCount(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.itemId === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  /**
   * Get the number of non-empty slots.
   */
  getUsedSlots(): number {
    return this.slots.filter(s => s.itemId !== null).length;
  }

  /**
   * Check if the inventory is full.
   */
  isFull(): boolean {
    return this.getUsedSlots() >= this.totalSlots;
  }

  /**
   * Find the first empty slot index.
   */
  findEmptySlot(): number {
    for (let i = 0; i < this.totalSlots; i++) {
      if (this.slots[i].itemId === null) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find the first slot containing an item.
   */
  findSlotWithItem(itemId: string): number {
    for (let i = 0; i < this.totalSlots; i++) {
      if (this.slots[i].itemId === itemId) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Alias for findSlotWithItem (used by some systems).
   */
  getSlotWithItem(itemId: string): number {
    return this.findSlotWithItem(itemId);
  }

  /**
   * Get the number of available (empty) slots.
   */
  getAvailableSpace(): number {
    return this.totalSlots - this.getUsedSlots();
  }

  /**
   * Public method to notify change callbacks.
   */
  emitChange(): void {
    this.notifyChange();
  }

  /**
   * Swap two slots.
   */
  swapSlots(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.totalSlots ||
        toIndex < 0 || toIndex >= this.totalSlots) {
      return;
    }
    const temp = { ...this.slots[fromIndex] };
    this.slots[fromIndex] = { ...this.slots[toIndex] };
    this.slots[toIndex] = temp;
    this.notifyChange();
  }

  /**
   * Clear all slots.
   */
  clear(): void {
    for (const slot of this.slots) {
      slot.itemId = null;
      slot.count = 0;
    }
    this.notifyChange();
  }

  /**
   * Register a callback for inventory changes.
   */
  onChange(callback: () => void): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * Notify all change callbacks.
   */
  private notifyChange(): void {
    for (const callback of this.onChangeCallbacks) {
      callback();
    }
  }

  /**
   * Serialize inventory to JSON.
   */
  serialize(): string {
    const data = {
      name: this.name,
      slots: this.slots.map(slot => ({
        itemId: slot.itemId,
        count: slot.count,
      })),
    };
    return JSON.stringify(data);
  }

  /**
   * Deserialize inventory from JSON.
   */
  deserialize(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (!data.slots || !Array.isArray(data.slots)) {
        Logger.warn('Inventory', 'Invalid inventory save data');
        return false;
      }

      for (let i = 0; i < this.totalSlots && i < data.slots.length; i++) {
        const slotData = data.slots[i];
        if (slotData.itemId && getItemDefinition(slotData.itemId)) {
          this.slots[i] = {
            itemId: slotData.itemId,
            count: Math.min(slotData.count, getItemDefinition(slotData.itemId)!.stackSize),
          };
        } else {
          this.slots[i] = { itemId: null, count: 0 };
        }
      }

      this.notifyChange();
      Logger.info('Inventory', `${this.name} loaded from save`);
      return true;
    } catch (e) {
      Logger.error('Inventory', `Failed to load inventory: ${e}`);
      return false;
    }
  }

  /**
   * Get a summary of inventory contents.
   */
  getSummary(): { itemId: string; count: number; name: string }[] {
    const summary: { itemId: string; count: number; name: string }[] = [];
    for (const slot of this.slots) {
      if (slot.itemId && slot.count > 0) {
        const def = getItemDefinition(slot.itemId);
        summary.push({
          itemId: slot.itemId,
          count: slot.count,
          name: def?.name ?? slot.itemId,
        });
      }
    }
    return summary;
  }
}
