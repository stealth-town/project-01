/**
 * Binance API Response Types
 */
interface BinancePriceResponse {
  symbol: string;  // Trading pair (e.g., "ETHUSDT")
  price: string;   // Price as string with decimal precision
}

/**
 * PriceService - Real-time price feed from Binance API
 * Fetches current ETH/USDT price from Binance
 *
 * This is a copy for the worker thread - needs to be independent
 */
export class PriceService {

  private readonly BINANCE_API_URL = 'https://api.binance.com/api/v3/ticker/price';
  private cachedPrice: number | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION_MS = 2000; // Cache for 2 seconds

  /**
   * Get current price for a symbol from Binance API
   * @param symbol - Asset symbol (default: ETH)
   * @returns Current price in USD
   */
  async getCurrentPrice(symbol: string = 'ETH'): Promise<number> {
    // Return cached price if still fresh (within 2 seconds)
    const now = Date.now();
    if (this.cachedPrice && (now - this.lastFetchTime) < this.CACHE_DURATION_MS) {
      return this.cachedPrice;
    }

    try {
      // Map symbol to Binance trading pair
      const binanceSymbol = this.mapSymbolToBinancePair(symbol);

      // Fetch price from Binance
      const response = await fetch(`${this.BINANCE_API_URL}?symbol=${binanceSymbol}`);

      if (!response.ok) {
        throw new Error(`Binance API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as BinancePriceResponse;

      // Validate response structure
      if (!data.price || !data.symbol) {
        throw new Error('Invalid response from Binance API: missing required fields');
      }

      const price = parseFloat(data.price);

      if (isNaN(price) || price <= 0) {
        throw new Error(`Invalid price received from Binance: ${data.price}`);
      }

      // Update cache
      this.cachedPrice = price;
      this.lastFetchTime = now;

      return price;

    } catch (error) {
      console.error('Failed to fetch price from Binance:', error);

      // Fallback to cached price if available
      if (this.cachedPrice) {
        console.warn('Using cached price due to fetch error');
        return this.cachedPrice;
      }

      throw new Error(`Failed to fetch ${symbol} price from Binance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map asset symbol to Binance trading pair
   */
  private mapSymbolToBinancePair(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'ETH': 'ETHUSDT',
      'BTC': 'BTCUSDT',
      // Add more mappings as needed
    };

    const pair = symbolMap[symbol.toUpperCase()];
    if (!pair) {
      throw new Error(`Unsupported symbol: ${symbol}`);
    }

    return pair;
  }

  /**
   * Clear the price cache (useful for testing)
   */
  clearCache() {
    this.cachedPrice = null;
    this.lastFetchTime = 0;
  }
}
