/**
 * Price service for fetching live cryptocurrency prices from Binance
 * Uses WebSocket for real-time updates with REST API fallback
 */

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

interface BinanceTradeMessage {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  p: string;      // Price
}

export class PriceService {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds
  private wsConnections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<(price: number) => void>> = new Map();
  private reconnectTimeouts: Map<string, number> = new Map();

  /**
   * Get current price for a symbol from Binance REST API
   */
  async getCurrentPrice(symbol: string = 'ETH'): Promise<number> {
    // Convert symbol to Binance format (ETH -> ETHUSDT)
    const binanceSymbol = `${symbol}USDT`;

    // Check cache
    const cached = this.priceCache.get(binanceSymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }

    try {
      const response = await fetch(`${BINANCE_API_URL}/ticker/price?symbol=${binanceSymbol}`);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data: BinanceTickerResponse = await response.json();
      const price = parseFloat(data.price);

      // Cache the result
      this.priceCache.set(binanceSymbol, {
        price,
        timestamp: Date.now()
      });

      return price;
    } catch (error) {
      console.error('Error fetching price from Binance:', error);

      // Return cached price if available, even if stale
      if (cached) {
        console.warn('Using stale cached price');
        return cached.price;
      }

      // Fallback to a default price
      console.warn('Using fallback price: 3000');
      return 3000;
    }
  }

  /**
   * Subscribe to real-time price updates via WebSocket
   * Automatically manages WebSocket connection and reconnection
   */
  subscribeToPriceUpdates(
    symbol: string,
    callback: (price: number) => void,
    _intervalMs?: number // Kept for backwards compatibility but unused (WebSocket is real-time)
  ): () => void {
    const binanceSymbol = `${symbol}USDT`.toLowerCase();

    // Add callback to subscribers
    if (!this.subscribers.has(binanceSymbol)) {
      this.subscribers.set(binanceSymbol, new Set());
    }
    this.subscribers.get(binanceSymbol)!.add(callback);

    // Fetch initial price via REST
    this.getCurrentPrice(symbol).then(callback).catch(console.error);

    // Create WebSocket connection if it doesn't exist
    if (!this.wsConnections.has(binanceSymbol)) {
      this.createWebSocketConnection(binanceSymbol);
    }

    // Return cleanup function
    return () => {
      const subs = this.subscribers.get(binanceSymbol);
      if (subs) {
        subs.delete(callback);

        // If no more subscribers, close WebSocket
        if (subs.size === 0) {
          this.closeWebSocketConnection(binanceSymbol);
        }
      }
    };
  }

  /**
   * Create WebSocket connection for a symbol
   */
  private createWebSocketConnection(binanceSymbol: string): void {
    const ws = new WebSocket(`${BINANCE_WS_URL}/${binanceSymbol}@trade`);
    this.wsConnections.set(binanceSymbol, ws);

    ws.onopen = () => {
      console.log(`[PriceService] WebSocket connected for ${binanceSymbol}`);
    };

    ws.onmessage = (event) => {
      try {
        const data: BinanceTradeMessage = JSON.parse(event.data);
        const price = parseFloat(data.p);

        // Update cache
        this.priceCache.set(binanceSymbol.toUpperCase(), {
          price,
          timestamp: Date.now()
        });

        // Notify all subscribers
        const subscribers = this.subscribers.get(binanceSymbol);
        if (subscribers) {
          subscribers.forEach(callback => callback(price));
        }
      } catch (error) {
        console.error('[PriceService] Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[PriceService] WebSocket error for ${binanceSymbol}:`, error);
    };

    ws.onclose = () => {
      console.log(`[PriceService] WebSocket closed for ${binanceSymbol}`);
      this.wsConnections.delete(binanceSymbol);

      // Attempt reconnection if there are still subscribers
      const subscribers = this.subscribers.get(binanceSymbol);
      if (subscribers && subscribers.size > 0) {
        console.log(`[PriceService] Reconnecting WebSocket for ${binanceSymbol} in 3s...`);
        const timeout = setTimeout(() => {
          this.reconnectTimeouts.delete(binanceSymbol);
          this.createWebSocketConnection(binanceSymbol);
        }, 3000);
        this.reconnectTimeouts.set(binanceSymbol, timeout);
      }
    };
  }

  /**
   * Close WebSocket connection for a symbol
   */
  private closeWebSocketConnection(binanceSymbol: string): void {
    const ws = this.wsConnections.get(binanceSymbol);
    if (ws) {
      ws.close();
      this.wsConnections.delete(binanceSymbol);
    }

    const timeout = this.reconnectTimeouts.get(binanceSymbol);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(binanceSymbol);
    }

    this.subscribers.delete(binanceSymbol);
    console.log(`[PriceService] Closed WebSocket for ${binanceSymbol}`);
  }
}

export const priceService = new PriceService();
