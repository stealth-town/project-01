import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import type { UserBalances, TownBuilding } from '@stealth-town/shared/types';
import { MAX_BUILDINGS, TOWN_LEVEL_SLOTS } from '@stealth-town/shared/types';
import { BalancesDisplay } from '../components/BalancesDisplay';
import { EnergyShop } from '../components/EnergyShop';
import { BuildingShop } from '../components/BuildingShop';
import { BuildingSidebar } from '../components/BuildingSidebar';
import { TradingMainContent } from '../components/TradingMainContent';
// styles in main.scss

export function TownPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [buildings, setBuildings] = useState<TownBuilding[]>([]);
  const [townLevel, setTownLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const loadTownState = async () => {
    if (!user?.id) {
      console.log('TownPage: No user ID, redirecting to login');
      setIsLoading(false);
      navigate('/login', { replace: true });
      return;
    }

    console.log('TownPage: Loading town state for user:', user.id);
    try {
      const data = await apiClient.getTownState(user.id);
      console.log('TownPage: Town state loaded:', data);
      setBalances(data.balances);
      setBuildings(data.buildings);
      setTownLevel(data.town.level);
      setError('');
    } catch (err: any) {
      console.error('TownPage: Error loading town state:', err);
      setError(err.message || 'Failed to load town state');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading before trying to load town state
    if (!authLoading) {
      loadTownState();
    }
  }, [user, authLoading]);

  // Auto-select first building on load
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuildingId]);

  // Auto-refresh when there are active buildings
  useEffect(() => {
    const hasActiveBuildings = buildings.some(b => b.status === 'active');

    if (!hasActiveBuildings) {
      return; // No polling needed
    }

    console.log('TownPage: Starting auto-refresh for active trades');

    // Poll every 2 seconds when there are active trades
    const intervalId = setInterval(() => {
      console.log('TownPage: Auto-refreshing town state');
      loadTownState();
    }, 2000);

    // Cleanup interval on unmount or when buildings change
    return () => {
      console.log('TownPage: Stopping auto-refresh');
      clearInterval(intervalId);
    };
  }, [buildings]);

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

  // Don't render if balances haven't loaded yet
  if (!balances) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading balances...</p>
      </div>
    );
  }

  // Calculate max slots from town level
  const maxSlots = TOWN_LEVEL_SLOTS[townLevel as keyof typeof TOWN_LEVEL_SLOTS] || MAX_BUILDINGS;

  // Get selected building
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || null;

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
          <BalancesDisplay balances={balances} />
          <EnergyShop balances={balances} onPurchase={loadTownState} />
          <BuildingShop
            townLevel={townLevel}
            buildings={buildings}
            balances={balances}
            onPurchase={loadTownState}
          />
        </aside>

        {/* Right Side - Buildings/Trading */}
        <main className="trading-panel">
          <div className="trading-layout">
            <BuildingSidebar
              buildings={buildings}
              maxSlots={maxSlots}
              selectedBuildingId={selectedBuildingId}
              onSelectBuilding={setSelectedBuildingId}
            />

            <TradingMainContent
              selectedBuilding={selectedBuilding}
              balances={balances}
              onUpdate={loadTownState}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
