/**
 * PriceService - Mock price feed for MVP
 * Returns simulated ETH prices with realistic variance
 */
export class PriceService {

  private basePrice: number = 3000; // Base ETH price in USD

  /**
   * Get current price for a symbol (mocked)
   * @param symbol - Asset symbol (default: ETH)
   * @returns Current price in USD
   */
  async getCurrentPrice(symbol: string = 'ETH'): Promise<number> {
    // Simulate async operation
    await this.delay(50);

    // Add random variance (+/- 2%)
    const variance = (Math.random() - 0.5) * 0.04; // -0.02 to +0.02
    const price = this.basePrice * (1 + variance);

    return parseFloat(price.toFixed(2));
  }

  /**
   * Set base price for testing
   */
  setBasePrice(price: number) {
    this.basePrice = price;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
