/**
 * Tool manager — tracks equipped tool, applies speed bonuses, and handles durability wear.
 */
import { Inventory } from './Inventory.js';
import { ItemDefinition, getItemDefinition, ToolType } from './ItemDefinition.js';
import { Logger } from '../utils/Logger.js';

/** Result of a tool wear operation. */
export interface ToolWearResult {
  toolWorn: boolean;
  toolBroken: boolean;
  toolId: string;
  durabilityRemaining: number;
}

/**
 * Manages tool equipping, speed bonuses, and durability.
 */
export class ToolManager {
  /** Currently equipped tool item ID (empty string = none). */
  private equippedToolId: string = '';
  /** Current durability of the equipped tool. */
  private equippedDurability: number = 0;
  /** Max durability of the equipped tool. */
  private equippedMaxDurability: number = 0;

  constructor() {}

  /**
   * Equip a tool from inventory.
   * @param itemId - The item ID to equip.
   * @param inventory - Player inventory to search for the tool.
   * @returns true if tool was equipped.
   */
  equipTool(itemId: string, inventory: Inventory): boolean {
    const def = getItemDefinition(itemId);
    if (!def || def.type !== 'tool') {
      Logger.debug('ToolManager', `Cannot equip non-tool item: ${itemId}`);
      return false;
    }

    // Find the slot with this tool
    const slotIndex = inventory.getSlotWithItem(itemId);
    if (slotIndex === -1) {
      Logger.debug('ToolManager', `Tool ${itemId} not found in inventory`);
      return false;
    }

    this.equippedToolId = itemId;
    this.equippedMaxDurability = def.toolDurability ?? 100;

    // Load current durability from the slot's metadata
    const slot = inventory.getSlot(slotIndex);
    if (slot && slot.metadata && typeof slot.metadata.durability === 'number') {
      this.equippedDurability = slot.metadata.durability;
    } else {
      this.equippedDurability = this.equippedMaxDurability;
    }

    Logger.info('ToolManager', `Equipped ${def.name} (durability: ${this.equippedDurability}/${this.equippedMaxDurability})`);
    return true;
  }

  /** Unequip the current tool. */
  unequipTool(): void {
    if (this.equippedToolId) {
      Logger.info('ToolManager', `Unequipped ${this.equippedToolId}`);
    }
    this.equippedToolId = '';
    this.equippedDurability = 0;
    this.equippedMaxDurability = 0;
  }

  /** Get the currently equipped tool item ID. */
  getEquippedToolId(): string {
    return this.equippedToolId;
  }

  /** Get the currently equipped tool definition. */
  getEquippedTool(): ItemDefinition | null {
    if (!this.equippedToolId) return null;
    return getItemDefinition(this.equippedToolId) ?? null;
  }

  /** Get the tool type of the equipped tool. */
  getEquippedToolType(): ToolType {
    const tool = this.getEquippedTool();
    return tool?.toolType ?? ToolType.NONE;
  }

  /** Get the speed multiplier of the equipped tool. */
  getSpeedMultiplier(): number {
    const tool = this.getEquippedTool();
    return tool?.toolSpeed ?? 1.0;
  }

  /**
   * Wear the equipped tool (consume durability).
   * @param wearAmount - Amount of durability to consume.
   * @returns Result of the wear operation.
   */
  wearTool(wearAmount: number = 1): ToolWearResult {
    if (!this.equippedToolId || this.equippedDurability <= 0) {
      return { toolWorn: false, toolBroken: false, toolId: '', durabilityRemaining: 0 };
    }

    this.equippedDurability = Math.max(0, this.equippedDurability - wearAmount);

    const toolBroken = this.equippedDurability <= 0;

    Logger.info('ToolManager',
      `Tool ${this.equippedToolId} worn: ${this.equippedDurability}/${this.equippedMaxDurability} ${toolBroken ? '(BROKEN!)' : ''}`
    );

    return {
      toolWorn: true,
      toolBroken,
      toolId: this.equippedToolId,
      durabilityRemaining: this.equippedDurability,
    };
  }

  /**
   * Save the equipped tool's durability back to inventory.
   * @param inventory - Player inventory to update.
   */
  saveToInventory(inventory: Inventory): void {
    if (!this.equippedToolId) return;

    const slotIndex = inventory.getSlotWithItem(this.equippedToolId);
    if (slotIndex === -1) {
      this.equippedToolId = '';
      return;
    }

    const slot = inventory.getSlot(slotIndex);
    if (slot) {
      slot.metadata = { ...slot.metadata, durability: this.equippedDurability };
      inventory.emitChange();
    }
  }

  /** Get current durability info. */
  getDurabilityInfo(): { current: number; max: number } | null {
    if (!this.equippedToolId) return null;
    return { current: this.equippedDurability, max: this.equippedMaxDurability };
  }

  /** Serialize tool state for saving. */
  serialize(): string {
    return JSON.stringify({
      equippedToolId: this.equippedToolId,
      equippedDurability: this.equippedDurability,
      equippedMaxDurability: this.equippedMaxDurability,
    });
  }

  /** Deserialize tool state from save data. */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.equippedToolId = parsed.equippedToolId ?? '';
      this.equippedDurability = parsed.equippedDurability ?? 0;
      this.equippedMaxDurability = parsed.equippedMaxDurability ?? 0;
    } catch {
      // Ignore deserialization errors
    }
  }
}
