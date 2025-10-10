import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import type { UserBalances, TownBuilding } from '@stealth-town/shared/types';
import { BalancesDisplay } from '../components/BalancesDisplay';
import { EnergyShop } from '../components/EnergyShop';
import { BuildingShop } from '../components/BuildingShop';
import { BuildingList } from '../components/BuildingList';
// styles in main.scss

export function TownPage() {
  const { user, logout } = useAuth();
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [buildings, setBuildings] = useState<TownBuilding[]>([]);
  const [townLevel, setTownLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTownState = async () => {
    if (!user) return;

    try {
      const data = await apiClient.getTownState(user.id);
      setBalances(data.balances);
      setBuildings(data.buildings);
      setTownLevel(data.town.townLevel);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load town state');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTownState();
  }, [user]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading your town...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button onClick={loadTownState} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="town-page">
      {/* Header */}
      <header className="town-header">
        <div className="header-content">
          <h1>Stealth Town</h1>
          <div className="header-actions">
            <span className="username">@{user?.username}</span>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="town-content">
        {/* Left Side - Shops */}
        <aside className="shops-panel">
          <BalancesDisplay balances={balances!} />
          <EnergyShop balances={balances!} onPurchase={loadTownState} />
          <BuildingShop
            townLevel={townLevel}
            buildings={buildings}
            balances={balances!}
            onPurchase={loadTownState}
          />
        </aside>

        {/* Right Side - Buildings/Trading */}
        <main className="trading-panel">
          <BuildingList
            buildings={buildings}
            balances={balances!}
            onUpdate={loadTownState}
          />
        </main>
      </div>
    </div>
  );
}
