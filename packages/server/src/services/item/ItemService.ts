import type { ItemId, CharacterId, ItemType } from "@stealth-town/shared/types";
import { ItemRepo, type ItemData } from "../../repos/ItemRepo.js";
import { CharacterService } from "../character/CharacterService.js";

export interface EquipItemRequest {
  itemId: ItemId;
  slot: number;
}

export class ItemService {
  private itemRepo: ItemRepo;
  private characterService: CharacterService;

  constructor() {
    this.itemRepo = new ItemRepo();
    this.characterService = new CharacterService();
  }

  /**
   * Get all items for a character
   */
  async getCharacterItems(characterId: CharacterId) {
    return await this.itemRepo.findByCharacterId(characterId);
  }

  /**
   * Get equipped items for a character
   */
  async getEquippedItems(characterId: CharacterId) {
    return await this.itemRepo.findEquippedByCharacterId(characterId);
  }

  /**
   * Get items by type for a character
   */
  async getItemsByType(characterId: CharacterId, itemType: ItemType) {
    return await this.itemRepo.findByCharacterIdAndType(characterId, itemType);
  }

  /**
   * Get a specific item by ID
   */
  async getItem(itemId: ItemId) {
    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    return item;
  }

  private getRandomItemType(): ItemType {
    return ["weapon", "armor", "accessory", "helmet", "boots", "gloves"][
      Math.floor(Math.random() * 6)
    ] as ItemType;
  }

  /**
   * Create a new item for a character
   */
  async createItem(character_id: CharacterId) {
    const itemData: ItemData = {
      character_id: character_id,
      item_type: this.getRandomItemType(),
      damage_contribution: Math.floor(Math.random() * 100),
      is_equipped: false,
    };

    return await this.itemRepo.create(itemData);
  }


  /**
   * Equip an item to a specific slot
   */
  async equipItem(request: EquipItemRequest) {
    const { itemId, slot } = request;

    // Validate slot number (1-6 based on database constraint)
    if (slot < 1 || slot > 6) {
      throw new Error("Invalid slot number. Must be between 1 and 6");
    }

    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Check if the item is already equipped in a different slot
    if (item.is_equipped && item.equipped_slot === slot) {
      throw new Error("Item is already equipped in this slot");
    }

    // If the item is equipped in a different slot, unequip it first
    if (item.is_equipped && item.equipped_slot !== slot) {
      await this.itemRepo.unequip(itemId);
    }

    // Update the character's damage rating
    await this.characterService.updateDamageRating(item.character_id, item.damage_contribution);

    return await this.itemRepo.equip(itemId, slot);
  }

  /**
   * Unequip an item
   */
  async unequipItem(itemId: ItemId) {
    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    if (!item.is_equipped) {
      throw new Error("Item is not equipped");
    }

    // Update the character's damage rating
    await this.characterService.updateDamageRating(item.character_id, item.damage_contribution, false);

    return await this.itemRepo.unequip(itemId);
  }

  /**
   * Get character's total damage contribution from equipped items
   */
  async getCharacterTotalDamage(characterId: CharacterId): Promise<number> {
    return await this.itemRepo.getTotalDamageContribution(characterId);
  }

  /**
   * Get character's equipment summary
   */
  async getEquipmentSummary(characterId: CharacterId) {
    const [equippedItems, totalDamage, itemCount] = await Promise.all([
      this.itemRepo.findEquippedByCharacterId(characterId),
      this.itemRepo.getTotalDamageContribution(characterId),
      this.itemRepo.countByCharacterId(characterId),
    ]);

    return {
      equippedItems,
      totalDamageContribution: totalDamage,
      totalItemCount: itemCount,
      equippedCount: equippedItems.length,
      availableSlots: 6 - equippedItems.length,
    };
  }
}
