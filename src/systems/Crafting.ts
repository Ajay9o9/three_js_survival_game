/**
 * Crafting system — recipes, ingredient checking, and item production.
 */
import { Inventory } from './Inventory.js';
import { ItemDefinition, getItemDefinition } from './ItemDefinition.js';
import { Logger } from '../utils/Logger.js';

/** A single crafting recipe. */
export interface CraftingRecipe {
  id: string;
  name: string;
  resultItemId: string;
  resultCount: number;
  ingredients: Record<string, number>; // itemId -> quantity needed
  category: string;
  /** If true, this recipe can be crafted repeatedly (not one-time). */
  repeatable: boolean;
}

/** Result of a craft attempt. */
export interface CraftResult {
  success: boolean;
  recipeId?: string;
  message: string;
}

/**
 * Central crafting system. Holds recipes and processes craft requests.
 */
export class CraftingSystem {
  private recipes: CraftingRecipe[] = [];
  /** Track one-time recipes (e.g., unlocks). */
  private craftedOnce: Set<string> = new Set();

  constructor() {
    this.registerRecipes();
  }

  /** Register all crafting recipes. */
  private registerRecipes(): void {
    this.recipes = [
      // Materials
      {
        id: 'plank',
        name: 'Plank',
        resultItemId: 'plank',
        resultCount: 4,
        ingredients: { wood: 1 },
        category: 'Materials',
        repeatable: true,
      },
      {
        id: 'stone_block',
        name: 'Stone Block',
        resultItemId: 'stone_block',
        resultCount: 2,
        ingredients: { stone: 1 },
        category: 'Materials',
        repeatable: true,
      },
      // Tools
      {
        id: 'wooden_axe',
        name: 'Wooden Axe',
        resultItemId: 'wooden_axe',
        resultCount: 1,
        ingredients: { plank: 3, stone: 1 },
        category: 'Tools',
        repeatable: true,
      },
      {
        id: 'stone_axe',
        name: 'Stone Axe',
        resultItemId: 'stone_axe',
        resultCount: 1,
        ingredients: { plank: 2, stone: 4 },
        category: 'Tools',
        repeatable: true,
      },
      {
        id: 'wooden_pickaxe',
        name: 'Wooden Pickaxe',
        resultItemId: 'wooden_pickaxe',
        resultCount: 1,
        ingredients: { plank: 3, stone: 1 },
        category: 'Tools',
        repeatable: true,
      },
      {
        id: 'stone_pickaxe',
        name: 'Stone Pickaxe',
        resultItemId: 'stone_pickaxe',
        resultCount: 1,
        ingredients: { plank: 2, stone: 4 },
        category: 'Tools',
        repeatable: true,
      },
      {
        id: 'wooden_sword',
        name: 'Wooden Sword',
        resultItemId: 'wooden_sword',
        resultCount: 1,
        ingredients: { plank: 2, stone: 1 },
        category: 'Tools',
        repeatable: true,
      },
      // Building
      {
        id: 'wooden_wall',
        name: 'Wooden Wall',
        resultItemId: 'wooden_wall',
        resultCount: 1,
        ingredients: { plank: 5 },
        category: 'Building',
        repeatable: true,
      },
      {
        id: 'wooden_floor',
        name: 'Wooden Floor',
        resultItemId: 'wooden_floor',
        resultCount: 1,
        ingredients: { plank: 3 },
        category: 'Building',
        repeatable: true,
      },
      {
        id: 'stone_wall',
        name: 'Stone Wall',
        resultItemId: 'stone_wall',
        resultCount: 1,
        ingredients: { stone_block: 5 },
        category: 'Building',
        repeatable: true,
      },
    ];
  }

  /** Get all registered recipes. */
  getRecipes(): CraftingRecipe[] {
    return this.recipes;
  }

  /** Get recipes filtered by category. */
  getRecipesByCategory(category: string): CraftingRecipe[] {
    return this.recipes.filter(r => r.category === category);
  }

  /** Get all unique categories. */
  getCategories(): string[] {
    return [...new Set(this.recipes.map(r => r.category))];
  }

  /**
   * Attempt to craft an item.
   * @param recipeId - The recipe ID to craft.
   * @param inventory - The player's inventory to consume ingredients from.
   * @returns Result of the craft attempt.
   */
  craft(recipeId: string, inventory: Inventory): CraftResult {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) {
      return { success: false, message: `Unknown recipe: ${recipeId}` };
    }

    // Check ingredients
    const canCraft = this.canCraft(recipe, inventory);
    if (!canCraft) {
      return { success: false, message: 'Not enough ingredients' };
    }

    // Consume ingredients
    for (const [itemId, amount] of Object.entries(recipe.ingredients)) {
      inventory.removeItem(itemId, amount);
    }

    // Add result
    const resultDef = getItemDefinition(recipe.resultItemId);
    if (!resultDef) {
      return { success: false, message: `Invalid result item: ${recipe.resultItemId}` };
    }

    const added = inventory.addItem(recipe.resultItemId, recipe.resultCount);
    if (added < recipe.resultCount) {
      // Partial add — refund ingredients
      for (const [itemId, amount] of Object.entries(recipe.ingredients)) {
        inventory.addItem(itemId, amount);
      }
      return { success: false, message: 'Inventory full — not enough space for result' };
    }

    Logger.info('Crafting', `Crafted ${recipe.resultCount}x ${resultDef.name} (recipe: ${recipeId})`);

    return { success: true, recipeId: recipe.id, message: `Crafted ${recipe.resultCount}x ${resultDef.name}` };
  }

  /** Check if the player has enough ingredients to craft a recipe. */
  canCraft(recipe: CraftingRecipe, inventory: Inventory): boolean {
    for (const [itemId, amount] of Object.entries(recipe.ingredients)) {
      if (inventory.getItemCount(itemId) < amount) {
        return false;
      }
    }
    // Check there's room for the result
    const resultDef = getItemDefinition(recipe.resultItemId);
    if (resultDef) {
      const spaceNeeded = recipe.resultCount;
      const spaceAvailable = inventory.getAvailableSpace();
      if (spaceAvailable < spaceNeeded) {
        // Also check if existing stack can absorb some
        const existingStack = inventory.getSlotWithItem(recipe.resultItemId);
        if (existingStack !== -1) {
          const slot = inventory.getSlot(existingStack);
          if (slot && resultDef.stackSize - slot.count >= spaceNeeded) {
            return true;
          }
        }
        return false;
      }
    }
    return true;
  }

  /** Get all recipes the player can currently craft. */
  getAvailableRecipes(inventory: Inventory): CraftingRecipe[] {
    return this.recipes.filter(r => this.canCraft(r, inventory));
  }

  /** Serialize craft state for saving. */
  serialize(): string {
    return JSON.stringify({
      craftedOnce: [...this.craftedOnce],
    });
  }

  /** Deserialize craft state from save data. */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.craftedOnce = new Set(parsed.craftedOnce || []);
    } catch {
      // Ignore deserialization errors
    }
  }
}
