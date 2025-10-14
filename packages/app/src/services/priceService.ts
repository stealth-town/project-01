/**
 * Price service for fetching live cryptocurrency prices from Binance
 */

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

export class PriceService {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds

  /**
   * Get current price for a symbol from Binance
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
   * Subscribe to price updates (polls every 1 seconds)
   */
  subscribeToPriceUpdates(
    symbol: string,
    callback: (price: number) => void,
    intervalMs: number = 1000
  ): () => void {
    // Initial fetch
    this.getCurrentPrice(symbol).then(callback);

    // Set up polling
    const intervalId = setInterval(async () => {
      const price = await this.getCurrentPrice(symbol);
      callback(price);
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

export const priceService = new PriceService();
