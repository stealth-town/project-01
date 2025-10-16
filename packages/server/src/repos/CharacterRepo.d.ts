import type { CharacterId, UserId } from "@stealth-town/shared/types";
export interface CharacterData {
    id?: CharacterId;
    user_id: UserId;
    damage_rating?: number;
}
export declare class CharacterRepo {
    /**
     * Find character by ID
     */
    findById(characterId: CharacterId): Promise<{
        created_at: string;
        damage_rating: number;
        id: string;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Find character by user ID
     */
    findByUserId(userId: UserId): Promise<{
        created_at: string;
        damage_rating: number;
        id: string;
        updated_at: string;
        user_id: string;
    } | null>;
    /**
     * Create a new character
     */
    create(characterData: CharacterData): Promise<{
        created_at: string;
        damage_rating: number;
        id: string;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Update a character
     */
    update(characterId: CharacterId, updates: Partial<CharacterData>): Promise<{
        created_at: string;
        damage_rating: number;
        id: string;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Delete a character
     */
    delete(characterId: CharacterId): Promise<{
        created_at: string;
        damage_rating: number;
        id: string;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Update character's damage rating
     */
    updateDamageRating(characterId: CharacterId, damageRating: number): Promise<{
        created_at: string;
        damage_rating: number;
        id: string;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Get all characters (for admin purposes)
     */
    findAll(): Promise<{
        created_at: string;
        damage_rating: number;
        id: string;
        updated_at: string;
        user_id: string;
    }[]>;
}
//# sourceMappingURL=CharacterRepo.d.ts.map