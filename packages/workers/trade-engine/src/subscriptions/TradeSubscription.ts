import { supabaseClient } from '@stealth-town/shared/supabase';
import { type Trade } from '@stealth-town/shared/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type TradeEventHandler = (trade: Trade) => void;

export class TradeSubscription {
  private channel: RealtimeChannel | null = null;
  private handlers: TradeEventHandler[] = [];

  /**
   * Subscribe to new active trades
   */
  async subscribe() {
    console.log('📡 Subscribing to trade updates...');

    this.channel = supabaseClient
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: 'status=eq.active'
        },
        (payload) => {
          console.log('🔔 New active trade detected:', payload.new.id);
          const trade = payload.new as Trade;
          this.notifyHandlers(trade);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: 'status=eq.active'
        },
        (payload) => {
          console.log('🔄 Trade updated to active:', payload.new.id);
          const trade = payload.new as Trade;
          this.notifyHandlers(trade);
        }
      )
      .subscribe();

    console.log('✅ Subscribed to trade updates');
  }

  /**
   * Unsubscribe from trade updates
   */
  async unsubscribe() {
    if (this.channel) {
      await supabaseClient.removeChannel(this.channel);
      this.channel = null;
      console.log('🔇 Unsubscribed from trade updates');
    }
  }

  /**
   * Register a handler for trade events
   */
  onTrade(handler: TradeEventHandler) {
    this.handlers.push(handler);
  }

  /**
   * Remove a handler
   */
  offTrade(handler: TradeEventHandler) {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  /**
   * Notify all handlers
   */
  private notifyHandlers(trade: Trade) {
    for (const handler of this.handlers) {
      try {
        handler(trade);
      } catch (error) {
        console.error('❌ Error in trade handler:', error);
      }
    }
  }
}
