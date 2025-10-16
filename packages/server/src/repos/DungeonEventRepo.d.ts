export interface DungeonEventData {
    id?: string;
    character_dungeon_id: string;
    damage_dealt: number;
    created_at?: string;
}
export declare class DungeonEventRepo {
    /**
     * Create a new dungeon event (hit)
     */
    create(data: DungeonEventData): Promise<{
        character_dungeon_id: string;
        created_at: string;
        damage_dealt: number;
        id: string;
    }>;
    /**
     * Get all events for a character dungeon
     */
    findByCharacterDungeonId(characterDungeonId: string): Promise<{
        character_dungeon_id: string;
        created_at: string;
        damage_dealt: number;
        id: string;
    }[]>;
    /**
     * Get recent events for a character dungeon (limit)
     */
    findRecentByCharacterDungeonId(characterDungeonId: string, limit?: number): Promise<{
        character_dungeon_id: string;
        created_at: string;
        damage_dealt: number;
        id: string;
    }[]>;
    /**
     * Count events for a character dungeon
     */
    countByCharacterDungeonId(characterDungeonId: string): Promise<number>;
    /**
     * Delete all events for a character dungeon (cleanup)
     */
    deleteByCharacterDungeonId(characterDungeonId: string): Promise<void>;
}
//# sourceMappingURL=DungeonEventRepo.d.ts.map