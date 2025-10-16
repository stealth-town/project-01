import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { Navigation } from '../components/Navigation';
import type { UserBalances } from '@stealth-town/shared/types';

interface Character {
  id: string;
  user_id: string;
  damage_rating: number;
  created_at: string;
  updated_at: string;
}

interface Item {
  id: string;
  character_id: string;
  item_type: string;
  damage_contribution: number;
  is_equipped: boolean;
  equipped_slot?: number;
  created_at: string;
  updated_at: string;
}

interface EquipmentSummary {
  equippedItems: Item[];
  totalDamageContribution: number;
  totalItemCount: number;
  equippedCount: number;
  availableSlots: number;
}

export function CharacterPage() {
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [equipmentSummary, setEquipmentSummary] = useState<EquipmentSummary | null>(null);
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemToEquip, setItemToEquip] = useState<string | null>(null);

  const loadCharacterData = async () => {
    if (!user?.id) return;

    try {
      // Load character
      const charData = await apiClient.getCharacterByUserId(user.id);
      setCharacter(charData.character);

      if (charData.character) {
        // Load items and equipment summary
        const [itemsData, summaryData, townState] = await Promise.all([
          apiClient.getCharacterItems(charData.character.id),
          apiClient.getEquipmentSummary(charData.character.id),
          apiClient.getTownState(user.id),
        ]);

        setItems(itemsData.items);
        setEquipmentSummary(summaryData);
        setBalances(townState.balances);
      }

      setError('');
    } catch (err: any) {
      console.error('Error loading character:', err);
      setError(err.message || 'Failed to load character data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharacterData();
  }, [user]);

  const handleBuyItem = async () => {
    if (!character || !user) return;

    try {
      await apiClient.buyItem(character.id, user.id);
      await loadCharacterData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to buy item');
    }
  };

  const handleEquipItem = async (itemId: string, slot: number) => {
    try {
      await apiClient.equipItem(itemId, slot);
      await loadCharacterData(); // Refresh data
      setItemToEquip(null);
    } catch (err: any) {
      alert(err.message || 'Failed to equip item');
    }
  };

  const handleUnequipItem = async (itemId: string) => {
    try {
      await apiClient.unequipItem(itemId);
      await loadCharacterData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to unequip item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiClient.deleteItem(itemId);
      await loadCharacterData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const openEquipModal = (itemId: string) => {
    setItemToEquip(itemId);
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading character...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <p>{error}</p>
        </div>
      </>
    );
  }

  if (!character) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No character found. Create one first!</p>
        </div>
      </>
    );
  }

  const unequippedItems = items.filter(item => !item.is_equipped);

  return (
    <>
      <Navigation />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 200px',
        gap: '2rem',
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Left Panel - Buy Item */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleBuyItem}
            disabled={!balances || balances.tokens < 100}
            style={{
              padding: '1rem',
              backgroundColor: balances && balances.tokens >= 100 ? '#4CAF50' : '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: balances && balances.tokens >= 100 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Buy Item Pack
            <br />
            (100 🪙)
          </button>
          {balances && balances.tokens < 100 && (
            <p style={{ fontSize: '12px', color: '#f44336' }}>
              Not enough tokens
            </p>
          )}
        </div>

        {/* Center - Character + Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Character Display */}
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '2rem',
            backgroundColor: '#1a1a1a',
          }}>
            <h2 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>Character</h2>
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 1rem',
              backgroundColor: '#333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
            }}>
              👤
            </div>

            {/* Equipment Slots */}
            <h3 style={{ margin: '1rem 0' }}>Equipment Slots</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
            }}>
              {[1, 2, 3, 4, 5, 6].map(slot => {
                const equippedItem = equipmentSummary?.equippedItems.find(
                  item => item.equipped_slot === slot
                );
                return (
                  <div
                    key={slot}
                    style={{
                      border: '1px solid #444',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      backgroundColor: equippedItem ? '#2a2a2a' : '#1a1a1a',
                      minHeight: '80px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#888' }}>Slot {slot}</div>
                    {equippedItem ? (
                      <>
                        <div style={{ fontSize: '14px', marginTop: '0.25rem' }}>
                          {equippedItem.item_type}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4CAF50' }}>
                          +{equippedItem.damage_contribution} DMG
                        </div>
                        <button
                          onClick={() => handleUnequipItem(equippedItem.id)}
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            fontSize: '11px',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Unequip
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '0.5rem' }}>
                        Empty
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inventory */}
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#1a1a1a',
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>
              Inventory ({unequippedItems.length}/20)
            </h3>
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {unequippedItems.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
                  No items in inventory. Buy item packs to get items!
                </p>
              ) : (
                unequippedItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      backgroundColor: '#2a2a2a',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.item_type}</div>
                      <div style={{ fontSize: '14px', color: '#4CAF50' }}>
                        +{item.damage_contribution} DMG
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEquipModal(item.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#2196F3',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Equip
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f44336',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Statistics */}
        <div style={{
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '1rem',
          backgroundColor: '#1a1a1a',
          height: 'fit-content',
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Damage Rating</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                {character.damage_rating}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Tokens</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {balances?.tokens || 0} 🪙
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Items Equipped</div>
              <div style={{ fontSize: '20px' }}>
                {equipmentSummary?.equippedCount || 0} / 6
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>Total Items</div>
              <div style={{ fontSize: '20px' }}>
                {equipmentSummary?.totalItemCount || 0} / 20
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equip Modal */}
      {itemToEquip && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '400px',
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Select Equipment Slot</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}>
              {[1, 2, 3, 4, 5, 6].map(slot => {
                const occupied = equipmentSummary?.equippedItems.some(
                  item => item.equipped_slot === slot
                );
                return (
                  <button
                    key={slot}
                    onClick={() => handleEquipItem(itemToEquip, slot)}
                    disabled={occupied}
                    style={{
                      padding: '1rem',
                      backgroundColor: occupied ? '#666' : '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: occupied ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Slot {slot}
                    {occupied && <div style={{ fontSize: '10px' }}>(Occupied)</div>}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setItemToEquip(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
