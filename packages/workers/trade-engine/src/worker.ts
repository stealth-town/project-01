import { parentPort, workerData } from 'worker_threads';
import { TradeMonitor } from './core/TradeMonitor.js';
import { TradeResolverWrapper } from './core/TradeResolverWrapper.js';
import { RealTradeResolver } from './resolvers/RealTradeResolver.js';
import { TradeRepo } from './repos/TradeRepo.js';
import { BuildingRepo } from './repos/BuildingRepo.js';
import { UserRepo } from './repos/UserRepo.js';
import { type Trade } from '@stealth-town/shared/types';

const { workerId } = workerData;

console.log(`[Worker ${workerId}] Starting trade monitoring with RealTradeResolver...`);

// Initialize repositories
const tradeRepo = new TradeRepo();
const buildingRepo = new BuildingRepo();
const userRepo = new UserRepo();

// Initialize resolver with RealTradeResolver using Binance price feed
const realResolver = new RealTradeResolver();
const resolverWrapper = new TradeResolverWrapper(
  realResolver,
  tradeRepo,
  buildingRepo,
  userRepo
);

// Create the trade monitor with realtime + polling
const tradeMonitor = new TradeMonitor(async (trade: Trade) => {
  console.log(`[Worker ${workerId}] Processing trade:`, trade.id);

  // Use the resolver wrapper to handle the trade
  await resolverWrapper.resolve(trade);
}, tradeRepo);

// Start monitoring
async function start() {
  try {
    await tradeMonitor.start();
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
  await tradeMonitor.stop();
  process.exit(0);
});