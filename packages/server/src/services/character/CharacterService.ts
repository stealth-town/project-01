import type { CharacterId, UserId } from "@stealth-town/shared/types";
import { CharacterRepo, type CharacterData } from "../../repos/CharacterRepo.js";
import { DungeonService } from "../dungeon/DungeonService.js";

export class CharacterService {
    private characterRepo: CharacterRepo;
    private dungeonService: DungeonService;

    constructor() {
        this.characterRepo = new CharacterRepo();
        this.dungeonService = new DungeonService();
    }

    /**
     * Get character by ID
     */
    async getCharacter(characterId: CharacterId) {
        const character = await this.characterRepo.findById(characterId);
        if (!character) {
            throw new Error("Character not found");
        }
        return character;
    }

    /**
     * Get character by user ID
     */
    async getCharacterByUserId(userId: UserId) {
        return await this.characterRepo.findByUserId(userId);
    }

    /**
     * Create a new character for a user
     */
    async createCharacter(userId: UserId) {
        // Check if user already has a character
        const existingCharacter = await this.characterRepo.findByUserId(userId);
        if (existingCharacter) {
            throw new Error("User already has a character");
        }

        const characterData: CharacterData = {
            user_id: userId,
            damage_rating: 0,
        };

        const character = await this.characterRepo.create(characterData);

        // Create initial dungeon run for the character
        await this.dungeonService.createDungeonRunIfNeeded(character.id);

        return character;
    }

    /**
     * Update character's damage rating
     */
    async updateDamageRating(characterId: CharacterId, damageRating: number, add = true) {
        const character = await this.characterRepo.findById(characterId);
        if (!character) {
            throw new Error("Character not found");
        }

        return await this.characterRepo.updateDamageRating(
            characterId,
            character.damage_rating + (add ? damageRating : -damageRating)
        );
    }

    /**
     * Delete a character
     */
    async deleteCharacter(characterId: CharacterId) {
        const character = await this.characterRepo.findById(characterId);
        if (!character) {
            throw new Error("Character not found");
        }

        return await this.characterRepo.delete(characterId);
    }

    /**
     * Get all characters
     */
    async getAllCharacters() {
        return await this.characterRepo.findAll();
    }
}

