import { CharacterRepo } from "../repos/CharacterRepo.js";
import { DungeonRunsRepo } from "../repos/DungeonRunsRepo.js";

export class DungeonResolver {
    private timeElapse: number;
    private rewardMultiplier: number;
    private dungeonRunsRepo: DungeonRunsRepo;
    private characterRepo: CharacterRepo;

    constructor() {
        this.dungeonRunsRepo = new DungeonRunsRepo();
        this.timeElapse = parseInt(process.env.TIME_ELAPSE || '10000');
        this.rewardMultiplier = parseFloat(process.env.REWARD_MULTIPLIER || '1');
        this.characterRepo = new CharacterRepo();
    }

    async resolve() {
        const timeNow = new Date();
        const dungeonRuns = await this.dungeonRunsRepo.findAllActive();

        await Promise.all(dungeonRuns.map(async (dungeonRun) => {
            const startedAt = new Date(dungeonRun.started_at);
            const expiredTime = new Date(startedAt.getTime() + this.timeElapse);

            if (startedAt && expiredTime < timeNow) {
                // finish the dungeon run
                await this.dungeonRunsRepo.finish(dungeonRun.id, dungeonRun.starting_damage_rating * this.rewardMultiplier);
                console.log("finished dungeon run", dungeonRun.id);
                const character = await this.characterRepo.findById(dungeonRun.character_id);
                if (character && character.damage_rating > 0) {
                    await this.dungeonRunsRepo.create({
                        character_id: dungeonRun.character_id,
                        user_id: dungeonRun.user_id,
                        duration_seconds: this.timeElapse / 1000,
                        starting_damage_rating: character.damage_rating,
                        started_at: expiredTime.toUTCString(),
                    });
                }
            }
        }));
    }
}