import { parentPort, workerData } from 'worker_threads';
import { DungeonRunsRepo } from './repos/DungeonRunsRepo';
import { CharacterRepo } from './repos/CharacterRepo';
import { DungeonManager } from './core/DungeonManager';


const { workerId } = workerData;

console.log(`[Worker ${workerId}] Starting dungeon runtime...`);

// Create the trade monitor with realtime + polling
const dungeonManager = new DungeonManager();
// Start monitoring
async function start() {
    try {
        await dungeonManager.start();
        console.log(`[Worker ${workerId}] Successfully started`);
    } catch (error) {
        console.error(`[Worker ${workerId}] Failed to start:`, error);
        process.exit(1);
    }
}

start();

// Send status updates to parent
setInterval(() => {
    if (parentPort) {
        parentPort.postMessage({
            workerId,
            status: 'running',
            timestamp: new Date().toISOString()
        });
    }
}, 10000); // Every 10 seconds

// Handle cleanup
process.on('SIGTERM', async () => {
    console.log(`[Worker ${workerId}] Stopping...`);
    await dungeonManager.stop();
    process.exit(0);
});