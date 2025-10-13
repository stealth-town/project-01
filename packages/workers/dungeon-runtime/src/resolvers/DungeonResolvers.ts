import { CharacterRepo } from "../repos/CharacterRepo";
import { DungeonRunsRepo } from "../repos/DungeonRunsRepo";

export class DungeonResolver {
    private timeElapse: number;
    private rewardPercentage: number;
    private dungeonRunsRepo: DungeonRunsRepo;
    private characterRepo: CharacterRepo;

    constructor() {
        this.dungeonRunsRepo = new DungeonRunsRepo();
        this.timeElapse = parseInt(process.env.TIME_ELAPSE || '10000');
        this.rewardPercentage = parseFloat(process.env.REWARD_PERCENTAGE || '0.05');
        this.characterRepo = new CharacterRepo();
    }

    async resolve() {
        const timeNow = new Date();
        const dungeonRuns = await this.dungeonRunsRepo.findAllActive();

        await Promise.all(dungeonRuns.map(async (dungeonRun) => {
            const startedAt = new Date(dungeonRun.started_at);
            const expiredTime = new Date(startedAt.getTime() + this.timeElapse);

            if (startedAt && expiredTime < timeNow) {
                await this.dungeonRunsRepo.finish(dungeonRun.id, dungeonRun.starting_damage_rating * this.rewardPercentage);
                const character = await this.characterRepo.findById(dungeonRun.character_id);
                await this.dungeonRunsRepo.create({
                    character_id: dungeonRun.character_id,
                    user_id: dungeonRun.user_id,
                    duration_seconds: this.timeElapse,
                    starting_damage_rating: character.damage_rating,
                    started_at: expiredTime.toUTCString(),
                });
            }
        }));
    }
}