import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main entry point for the dungeon runtime worker pool
 * This spawns and manages worker threads
 */
class DungeonRuntimeManager {

    private workers: Worker[] = [];
    private workerCount: number;

    constructor(workerCount: number = 1) {
        this.workerCount = workerCount;
    }

    start() {
        console.log(`🏭 Starting Dungeon Runtime with ${this.workerCount} worker(s)...`);

        for (let i = 0; i < this.workerCount; i++) {
            this.spawnWorker(i);
        }
    }

    private spawnWorker(id: number) {
        const workerPath = join(__dirname, 'worker.js');
        const worker = new Worker(workerPath, {
            workerData: { workerId: id }
        });

        worker.on('message', (msg: any) => {
            console.log(`[Worker ${id}] Message:`, msg);
        });

        worker.on('error', (err: any) => {
            console.error(`[Worker ${id}] Error:`, err);
            // Respawn worker on error
            setTimeout(() => {
                console.log(`[Worker ${id}] Respawning...`);
                this.spawnWorker(id);
            }, 1000);
        });

        worker.on('exit', (code: any) => {
            if (code !== 0) {
                console.error(`[Worker ${id}] Exited with code ${code}`);
                // Respawn worker on unexpected exit
                setTimeout(() => {
                    console.log(`[Worker ${id}] Respawning...`);
                    this.spawnWorker(id);
                }, 1000);
            }
        });

        this.workers.push(worker);
        console.log(`✅ Worker ${id} spawned`);
    }

    stop() {
        console.log('🛑 Stopping all workers...');
        this.workers.forEach((worker, i) => {
            worker.terminate();
            console.log(`❌ Worker ${i} terminated`);
        });
    }
}

// Start the worker pool
const manager = new DungeonRuntimeManager(1); // Start with 1 worker
manager.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    manager.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    manager.stop();
    process.exit(0);
});