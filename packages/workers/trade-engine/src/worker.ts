import { parentPort, workerData } from 'worker_threads';
import { TradeMonitor } from './core/TradeMonitor.js';
import { TradeResolverWrapper } from './core/TradeResolverWrapper.js';
import { MockTradeResolver } from './resolvers/MockTradeResolver.js';

const { workerId } = workerData;

console.log(`[Worker ${workerId}] Starting trade monitoring...`);

const mockResolver = new MockTradeResolver();
const resolverWrapper = new TradeResolverWrapper(mockResolver);

// Create the trade monitor with a trigger callback
const tradeMonitor = new TradeMonitor(async (trade: any) => {
  console.log(`[Worker ${workerId}] Trade triggered:`, trade);
  
  // Use the resolver wrapper to handle the trade
  await resolverWrapper.resolve(trade);
});

// Start monitoring
tradeMonitor.start();

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
process.on('SIGTERM', () => {
  console.log(`[Worker ${workerId}] Stopping...`);
  tradeMonitor.stop();
  process.exit(0);
});