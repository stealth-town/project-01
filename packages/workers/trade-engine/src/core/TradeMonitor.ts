/**
 * TradeMonitor - Listens for trade events and triggers callbacks
 * 
 * This class will eventually connect to Supabase Realtime or polling mechanism
 * For now, it's a dummy implementation that simulates trade events
 */

export type Trade = {
    id: string;
    userId: string;
    buildingId: string;
    assetId: string;
    riskMode: 'turtle' | 'walk' | 'cheetah';
    state: 'pending' | 'active' | 'completed' | 'liquidated';
    startedAt?: string;
};

export type TradeTriggerCallback = (trade: Trade) => Promise<void>;

export class TradeMonitor {
    private callback: TradeTriggerCallback;
    private isRunning: boolean = false;
    private simulationInterval?: NodeJS.Timeout;

    constructor(callback: TradeTriggerCallback) {
        this.callback = callback;
    }

    /**
     * Start monitoring for trades
     * In real implementation, this would:
     * - Subscribe to Supabase Realtime
     * - Or poll the database for new trades
     */
    start() {
        console.log('🔍 TradeMonitor started');
        this.isRunning = true;

        // Dummy implementation: simulate a new trade every 15 seconds
        this.simulationInterval = setInterval(() => {
            this.simulateNewTrade();
        }, 15000);

        // Also simulate one immediately for testing
        setTimeout(() => this.simulateNewTrade(), 2000);
    }

    /**
     * Stop monitoring
     */
    stop() {
        console.log('🛑 TradeMonitor stopped');
        this.isRunning = false;
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
    }

    /**
     * Simulate a new trade being created
     * In real implementation, this would be triggered by DB events
     */
    private async simulateNewTrade() {
        if (!this.isRunning) return;

        const dummyTrade: Trade = {
            id: this.generateId(),
            userId: this.generateId(),
            buildingId: this.generateId(),
            assetId: this.generateId(),
            riskMode: this.randomRiskMode(),
            state: 'active',
            startedAt: new Date().toISOString()
        };

        console.log('📢 New trade detected:', dummyTrade.id);

        try {
            await this.callback(dummyTrade);
        } catch (error) {
            console.error('❌ Error in trade callback:', error);
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    private randomRiskMode(): 'turtle' | 'walk' | 'cheetah' {
        const modes = ['turtle', 'walk', 'cheetah'] as const;
        return modes[Math.floor(Math.random() * modes.length)] as 'turtle' | 'walk' | 'cheetah';
    }
}