import { DungeonResolver } from "../resolvers/DungeonResolvers";

export class DungeonManager {
    private pollingInterval: number;
    private dungeonResolver: DungeonResolver;
    constructor() {
        this.pollingInterval = parseInt(process.env.DUNGEON_POLLING_INTERVAL || '10000');
        this.dungeonResolver = new DungeonResolver();
    }

    async start() {
        console.log('DungeonManager started');
        this.startPolling();
    }

    async stop() {
        console.log('DungeonManager stopped');
    }

    async startPolling() {
        console.log('DungeonManager started polling');
        setInterval(async () => {
            await this.dungeonResolver.resolve();
        }, this.pollingInterval);
    }

}