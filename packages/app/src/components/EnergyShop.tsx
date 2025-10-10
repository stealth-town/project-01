import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { EnergyPackage, ENERGY_PACKAGES, type UserBalances } from '@stealth-town/shared/types';
// styles in main.scss

interface EnergyShopProps {
  balances: UserBalances;
  onPurchase: () => void;
}

export function EnergyShop({ balances, onPurchase }: EnergyShopProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async (packageType: EnergyPackage) => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      await apiClient.buyEnergy(user.id, packageType);
      onPurchase();
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setIsLoading(false);
    }
  };

  const packages = [
    { type: EnergyPackage.SMALL, name: 'Small', ...ENERGY_PACKAGES[EnergyPackage.SMALL] },
    { type: EnergyPackage.MEDIUM, name: 'Medium', ...ENERGY_PACKAGES[EnergyPackage.MEDIUM] },
    { type: EnergyPackage.LARGE, name: 'Large', ...ENERGY_PACKAGES[EnergyPackage.LARGE] },
  ];

  return (
    <div className="energy-shop">
      <h2>Energy Shop</h2>
      {error && <div className="shop-error">{error}</div>}

      <div className="packages-grid">
        {packages.map((pkg) => {
          const canAfford = balances.usdc >= pkg.usdc;

          return (
            <div key={pkg.type} className={`package-card ${!canAfford ? 'disabled' : ''}`}>
              <div className="package-header">
                <span className="package-name">{pkg.name}</span>
                <span className="package-energy">{pkg.energy} ⚡</span>
              </div>
              <div className="package-price">${pkg.usdc}</div>
              <button
                onClick={() => handlePurchase(pkg.type)}
                disabled={isLoading || !canAfford}
                className="purchase-button"
              >
                {!canAfford ? 'Insufficient USDC' : isLoading ? 'Buying...' : 'Buy'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
