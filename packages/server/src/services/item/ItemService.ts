import type { ItemId, CharacterId, ItemType, UserId } from "@stealth-town/shared/types";
import { ItemRepo, type ItemData } from "../../repos/ItemRepo.js";
import { CharacterService } from "../character/CharacterService.js";
import { DungeonService } from "../dungeon/DungeonService.js";
import { UserRepo } from "../../repos/UserRepo.js";
import { ConcreteItemsRepo } from "../../repos/ConcreteItemsRepo.js";
import type { ConcreteItem, ItemRarity } from "@stealth-town/shared/types";

const SEED = process.env.SEED || "randomseeeeeed";

export interface EquipItemRequest {
  itemId: ItemId;
  slot: number;
}

export type ItemWithRarity = {
  item: ConcreteItem;
  rarity: ItemRarity;
}

export class ItemService {
  private itemRepo: ItemRepo;
  private characterService: CharacterService;
  private dungeonService: DungeonService;
  private userRepo: UserRepo;
  private concreteItemsRepo: ConcreteItemsRepo;

  constructor() {
    this.itemRepo = new ItemRepo();
    this.characterService = new CharacterService();
    this.dungeonService = new DungeonService();
    this.userRepo = new UserRepo();
    this.concreteItemsRepo = new ConcreteItemsRepo();
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

  private getRandomItem(): number {
    return Math.floor(Math.random() * 30) + 1;
  }

  private getItemRarity(): ItemRarity {
    const rarity = Math.floor(Math.random() * 100) + 1;

    if (rarity <= 55) {
      return "common" as ItemRarity;
    } else if (rarity <= 80) {
      return "rare" as ItemRarity;
    } else if (rarity <= 95) {
      return "epic" as ItemRarity;
    } else {
      return "legendary" as ItemRarity;
    }
  }

  /**
   * Create a new item for a character (buy item pack)
   * Costs 100 tokens per item
   */
  async createItem(character_id: CharacterId, user_id: UserId, choice: number) {
    const ITEM_COST = 100; // tokens

    // Check if character belongs to user
    const character = await this.characterService.getCharacter(character_id);
    if (character.user_id !== user_id) {
      throw new Error("Character does not belong to user");
    }

    // Check inventory limit (max 20 items)
    const itemCount = await this.itemRepo.countByCharacterId(character_id);
    if (itemCount >= 20) {
      throw new Error("Inventory is full (maximum 20 items)");
    }

    // Check token balance
    const user = await this.userRepo.findById(user_id);
    // if (user.tokens < ITEM_COST) {
    //   throw new Error(`Insufficient tokens: required ${ITEM_COST}, available ${user.tokens}`);
    // }

    // Deduct tokens
    // await this.userRepo.deductCurrency(user_id, "tokens", ITEM_COST);

    const concreteItems: ItemWithRarity[] = [];
    for (let i = 0; i < 3; i++) {
      const concreteItem = await this.concreteItemsRepo.getConcreteItem(this.getRandomItem());
      const rarity = this.getItemRarity();
      concreteItems.push({ item: concreteItem, rarity });
    }

    const choiceItem = concreteItems[choice];
    if (!choiceItem) {
      throw new Error("Choice item not found");
    }
    const rarityMultiplier = choiceItem.rarity === "common" ? 1 : choiceItem.rarity === "rare" ? 1.2 : choiceItem.rarity === "epic" ? 1.5 : 2;
    // Create item
    const itemData: ItemData = {
      character_id: character_id,
      concrete_item_id: choiceItem.item.id,
      rarity: choiceItem.rarity,
      damage_contribution: Math.ceil(choiceItem.item.dmg * rarityMultiplier),
      is_equipped: false,
    };

    await this.itemRepo.create(itemData);

    return concreteItems;
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
    await this.dungeonService.createDungeonRunIfNeeded(item.character_id);

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

  /**
   * Delete an item from inventory
   */
  async deleteItem(itemId: ItemId) {
    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // If equipped, update character's damage rating first
    if (item.is_equipped) {
      await this.characterService.updateDamageRating(
        item.character_id,
        item.damage_contribution,
        false // subtract damage
      );
    }

    return await this.itemRepo.delete(itemId);
  }
}
