import type { UserBalances } from '@stealth-town/shared/types';
// styles in main.scss

interface BalancesDisplayProps {
  balances: UserBalances;
}

export function BalancesDisplay({ balances }: BalancesDisplayProps) {
  return (
    <div className="balances-display">
      <h2>Your Balances</h2>
      <div className="balances-grid">
        <div className="balance-item energy">
          <span className="balance-label">Energy</span>
          <span className="balance-value">{balances.energy}</span>
        </div>
        <div className="balance-item tokens">
          <span className="balance-label">Tokens</span>
          <span className="balance-value">{balances.tokens}</span>
        </div>
        <div className="balance-item usdc">
          <span className="balance-label">USDC</span>
          <span className="balance-value">${balances.usdc.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
