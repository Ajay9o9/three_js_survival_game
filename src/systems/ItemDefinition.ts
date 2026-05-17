/**
 * Item definitions and item type system.
 * Defines all items, their properties, and categories.
 */

export enum ItemType {
  RESOURCE = 'resource',
  FOOD = 'food',
  TOOL = 'tool',
  MATERIAL = 'material',
  BUILDING = 'building',
}

export enum ToolType {
  NONE = 'none',
  AXE = 'axe',
  PICKAXE = 'pickaxe',
  SWORD = 'sword',
  HOE = 'hoe',
}

export enum ResourceNode {
  TREE = 'tree',
  ROCK = 'rock',
  ORE = 'ore',
  BUSH = 'bush',
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  stackSize: number;
  icon?: string;
  // Resource-specific
  resourceType?: ResourceNode;
  // Food-specific
  foodValue?: number; // hunger restored
  // Tool-specific
  toolType?: ToolType;
  toolDamage?: number; // for swords
  toolSpeed?: number; // gathering speed multiplier
  toolDurability?: number; // max durability
  // Building-specific
  buildCost?: Record<string, number>; // item id -> quantity
}

/**
 * Central item registry. All items must be defined here.
 */
export const ItemRegistry: Record<string, ItemDefinition> = {
  // Resources
  wood: {
    id: 'wood',
    name: 'Wood',
    description: 'A piece of wood from a tree.',
    type: ItemType.RESOURCE,
    stackSize: 64,
    resourceType: ResourceNode.TREE,
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    description: 'A piece of stone from a rock.',
    type: ItemType.RESOURCE,
    stackSize: 64,
    resourceType: ResourceNode.ROCK,
  },
  ore: {
    id: 'ore',
    name: 'Ore',
    description: 'Raw ore mined from an ore deposit.',
    type: ItemType.RESOURCE,
    stackSize: 32,
    resourceType: ResourceNode.ORE,
  },
  berries: {
    id: 'berries',
    name: 'Berries',
    description: 'Sweet wild berries.',
    type: ItemType.FOOD,
    stackSize: 16,
    foodValue: 10,
    resourceType: ResourceNode.BUSH,
  },

  // Materials
  plank: {
    id: 'plank',
    name: 'Plank',
    description: 'A crafted wooden plank.',
    type: ItemType.MATERIAL,
    stackSize: 64,
  },
  stoneBlock: {
    id: 'stone_block',
    name: 'Stone Block',
    description: 'A crafted stone building block.',
    type: ItemType.MATERIAL,
    stackSize: 64,
  },

  // Tools
  woodenAxe: {
    id: 'wooden_axe',
    name: 'Wooden Axe',
    description: 'A basic axe for chopping wood.',
    type: ItemType.TOOL,
    stackSize: 1,
    toolType: ToolType.AXE,
    toolDamage: 3,
    toolSpeed: 1.5,
    toolDurability: 50,
  },
  stoneAxe: {
    id: 'stone_axe',
    name: 'Stone Axe',
    description: 'A sturdy stone axe.',
    type: ItemType.TOOL,
    stackSize: 1,
    toolType: ToolType.AXE,
    toolDamage: 5,
    toolSpeed: 2.0,
    toolDurability: 100,
  },
  woodenPickaxe: {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    description: 'A basic pickaxe for mining.',
    type: ItemType.TOOL,
    stackSize: 1,
    toolType: ToolType.PICKAXE,
    toolDamage: 3,
    toolSpeed: 1.5,
    toolDurability: 50,
  },
  stonePickaxe: {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    description: 'A sturdy stone pickaxe.',
    type: ItemType.TOOL,
    stackSize: 1,
    toolType: ToolType.PICKAXE,
    toolDamage: 5,
    toolSpeed: 2.0,
    toolDurability: 100,
  },
  woodenSword: {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'A basic wooden sword.',
    type: ItemType.TOOL,
    stackSize: 1,
    toolType: ToolType.SWORD,
    toolDamage: 8,
    toolSpeed: 1.0,
    toolDurability: 40,
  },

  // Building items
  woodenWall: {
    id: 'wooden_wall',
    name: 'Wooden Wall',
    description: 'A wooden wall for building.',
    type: ItemType.BUILDING,
    stackSize: 32,
    buildCost: { plank: 5 },
  },
  woodenFloor: {
    id: 'wooden_floor',
    name: 'Wooden Floor',
    description: 'A wooden floor plank.',
    type: ItemType.BUILDING,
    stackSize: 32,
    buildCost: { plank: 3 },
  },
  stoneWall: {
    id: 'stone_wall',
    name: 'Stone Wall',
    description: 'A sturdy stone wall.',
    type: ItemType.BUILDING,
    stackSize: 32,
    buildCost: { stone_block: 5 },
  },
};

/**
 * Get an item definition by ID.
 */
export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ItemRegistry[id];
}

/**
 * Get all item IDs.
 */
export function getAllItemIds(): string[] {
  return Object.keys(ItemRegistry);
}

/**
 * Get items by type.
 */
export function getItemsByType(type: ItemType): ItemDefinition[] {
  return Object.values(ItemRegistry).filter(item => item.type === type);
}
