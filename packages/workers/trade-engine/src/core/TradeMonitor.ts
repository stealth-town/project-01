import { type Trade } from '@stealth-town/shared/types';
import { TradeSubscription } from '../subscriptions/TradeSubscription.js';
import { TradeRepo } from '../repos/TradeRepo.js';

/**
 * TradeMonitor - Listens for trade events via realtime and polling
 *
 * Uses two mechanisms:
 * 1. Supabase Realtime - for instant new trade notifications
 * 2. Polling - for checking existing active trades (fallback + resolution checks)
 */

export type TradeTriggerCallback = (trade: Trade) => Promise<void>;

export class TradeMonitor {
    private callback: TradeTriggerCallback;
    private isRunning: boolean = false;
    private subscription: TradeSubscription;
    private tradeRepo: TradeRepo;
    private pollingInterval?: NodeJS.Timeout;
    private pollingIntervalMs: number = 10000; // Poll every 10 seconds
    private processedTrades: Set<string> = new Set(); // Track processed trades

    constructor(callback: TradeTriggerCallback, tradeRepo: TradeRepo) {
        this.callback = callback;
        this.tradeRepo = tradeRepo;
        this.subscription = new TradeSubscription();
    }

    /**
     * Start monitoring for trades
     * Sets up realtime subscriptions and polling
     */
    async start() {
        console.log('🔍 TradeMonitor started');
        this.isRunning = true;

        // Subscribe to realtime trade events
        await this.subscription.subscribe();
        this.subscription.onTrade((trade) => this.handleTrade(trade));

        // Start polling for active trades
        this.startPolling();

        // Initial poll to catch any existing trades
        await this.pollActiveTrades();
    }

    /**
     * Stop monitoring
     */
    async stop() {
        console.log('🛑 TradeMonitor stopped');
        this.isRunning = false;

        await this.subscription.unsubscribe();

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.processedTrades.clear();
    }

    /**
     * Start polling for active trades
     */
    private startPolling() {
        this.pollingInterval = setInterval(async () => {
            if (this.isRunning) {
                await this.pollActiveTrades();
            }
        }, this.pollingIntervalMs);
    }

    /**
     * Poll database for active trades
     */
    private async pollActiveTrades() {
        try {
            const activeTrades = await this.tradeRepo.getAllActiveTrades();

            for (const trade of activeTrades) {
                // Always process active trades for resolution checks
                await this.handleTrade(trade);
            }

            // Clean up processed trades that are no longer active
            const activeTradeIds = new Set(activeTrades.map(t => t.id));
            for (const tradeId of this.processedTrades) {
                if (!activeTradeIds.has(tradeId)) {
                    this.processedTrades.delete(tradeId);
                }
            }
        } catch (error) {
            console.error('❌ Error polling active trades:', error);
        }
    }

    /**
     * Handle a trade (from realtime or polling)
     */
    private async handleTrade(trade: Trade) {
        if (!this.isRunning) return;

        console.log(`📢 Processing trade: ${trade.id}`);

        try {
            await this.callback(trade);
            this.processedTrades.add(trade.id);
        } catch (error) {
            console.error(`❌ Error processing trade ${trade.id}:`, error);
        }
    }
}