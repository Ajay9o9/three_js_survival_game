/**
 * Save/load system using localStorage for persistence.
 * Saves player stats, inventory, position, and world state.
 */
import { Logger } from '../utils/Logger.js';

export interface SaveData {
  version: number;
  timestamp: number;
  player: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    health: number;
    hunger: number;
    stamina: number;
    inventory: string; // JSON string of inventory
  };
  world: {
    gameTime: number;
    dayAngle: number;
    resourceNodes?: Array<{
      id: string;
      position: { x: number; y: number; z: number };
      health: number;
      resourceType: string;
    }>;
  };
}

export class SaveSystem {
  private static readonly SAVE_KEY = 'survival_game_save';
  private static readonly VERSION = 1;

  private savePath: string;

  constructor(savePath: string = SaveSystem.SAVE_KEY) {
    this.savePath = savePath;
    Logger.info('SaveSystem', `Save system initialized (key: ${savePath})`);
  }

  /**
   * Create default save data.
   */
  private createDefaultSave(): SaveData {
    return {
      version: SaveSystem.VERSION,
      timestamp: Date.now(),
      player: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        health: 100,
        hunger: 100,
        stamina: 100,
        inventory: '',
      },
      world: {
        gameTime: 0,
        dayAngle: 0,
        resourceNodes: [],
      },
    };
  }

  /**
   * Save game data to localStorage.
   */
  save(data: Partial<SaveData>): boolean {
    try {
      // Load existing save or create default
      const existing = this.load();
      const saveData: SaveData = existing || this.createDefaultSave();

      // Merge in new data
      if (data.player) {
        saveData.player = { ...saveData.player, ...data.player };
      }
      if (data.world) {
        saveData.world = { ...saveData.world, ...data.world };
      }

      saveData.timestamp = Date.now();
      saveData.version = SaveSystem.VERSION;

      localStorage.setItem(this.savePath, JSON.stringify(saveData));
      Logger.info('SaveSystem', 'Game saved successfully');
      return true;
    } catch (e) {
      Logger.error('SaveSystem', `Failed to save: ${e}`);
      return false;
    }
  }

  /**
   * Load game data from localStorage.
   */
  load(): SaveData | null {
    try {
      const data = localStorage.getItem(this.savePath);
      if (!data) {
        Logger.info('SaveSystem', 'No save data found');
        return null;
      }

      const parsed = JSON.parse(data) as SaveData;

      // Validate version
      if (parsed.version !== SaveSystem.VERSION) {
        Logger.warn('SaveSystem', `Save version mismatch: expected ${SaveSystem.VERSION}, got ${parsed.version}`);
        // Could add migration logic here
      }

      Logger.info('SaveSystem', `Game loaded (timestamp: ${new Date(parsed.timestamp).toLocaleString()})`);
      return parsed;
    } catch (e) {
      Logger.error('SaveSystem', `Failed to load save: ${e}`);
      return null;
    }
  }

  /**
   * Check if a save exists.
   */
  hasSave(): boolean {
    return localStorage.getItem(this.savePath) !== null;
  }

  /**
   * Delete the save file.
   */
  deleteSave(): boolean {
    try {
      localStorage.removeItem(this.savePath);
      Logger.info('SaveSystem', 'Save deleted');
      return true;
    } catch (e) {
      Logger.error('SaveSystem', `Failed to delete save: ${e}`);
      return false;
    }
  }

  /**
   * Get save info (timestamp, version) without full parse.
   */
  getSaveInfo(): { timestamp: number; version: number } | null {
    try {
      const data = localStorage.getItem(this.savePath);
      if (!data) return null;
      const parsed = JSON.parse(data) as SaveData;
      return {
        timestamp: parsed.timestamp,
        version: parsed.version,
      };
    } catch {
      return null;
    }
  }

  /**
   * Auto-save player state.
   */
  autoSave(player: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    health: number;
    hunger: number;
    stamina: number;
    inventory: string;
  }, world: {
    gameTime: number;
    dayAngle: number;
  }): boolean {
    return this.save({ player, world });
  }

  /**
   * Get the last save timestamp as a formatted string.
   */
  getFormattedSaveTime(): string | null {
    const info = this.getSaveInfo();
    if (!info) return null;
    return new Date(info.timestamp).toLocaleString();
  }
}
