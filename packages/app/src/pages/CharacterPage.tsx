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

  // Gacha state
  const [showGachaConfirm, setShowGachaConfirm] = useState(false);
  const [showGachaSelection, setShowGachaSelection] = useState(false);
  const [showGachaReveal, setShowGachaReveal] = useState(false);
  const [offeredItems, setOfferedItems] = useState<any[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [revealedItem, setRevealedItem] = useState<any>(null);
  const [showOtherCards, setShowOtherCards] = useState(false);

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

  const handleBuyItem = () => {
    setShowGachaConfirm(true);
  };

  const handleConfirmBuy = async () => {
    if (!character || !user) return;

    try {
      setShowGachaConfirm(false);
      const response = await apiClient.initiateGacha(character.id, user.id);
      setOfferedItems(response.offeredItems);
      setShowGachaSelection(true);
      setSelectedCardIndex(null);
    } catch (err: any) {
      alert(err.message || 'Failed to initiate gacha');
    }
  };

  const handleCancelBuy = () => {
    setShowGachaConfirm(false);
  };

  const handleCardSelect = (index: number) => {
    setSelectedCardIndex(index);
  };

  const handleConfirmSelection = async () => {
    if (selectedCardIndex === null || !character || !user) return;

    try {
      const response = await apiClient.confirmGacha(character.id, user.id, selectedCardIndex, offeredItems);
      setRevealedItem(response.allOfferedItems[selectedCardIndex]);
      setShowGachaSelection(false);
      setShowGachaReveal(true);
      setShowOtherCards(false);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm selection');
      setShowGachaSelection(false);
      setOfferedItems([]);
      setSelectedCardIndex(null);
    }
  };

  const handleShowOtherCards = () => {
    setShowOtherCards(true);
  };

  const handleCollect = async () => {
    setShowGachaReveal(false);
    setRevealedItem(null);
    setOfferedItems([]);
    setSelectedCardIndex(null);
    setShowOtherCards(false);
    await loadCharacterData();
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#4CAF50'; // Green
      case 'rare': return '#2196F3'; // Blue
      case 'epic': return '#9C27B0'; // Purple
      case 'legendary': return '#FF9800'; // Orange
      default: return '#4CAF50';
    }
  };

  const getSlotName = (slot: number) => {
    switch (slot) {
      case 1: return 'Helmet';
      case 2: return 'Main Weapon';
      case 3: return 'Off-Hand';
      case 4: return 'Boots';
      case 5: return 'Trinket';
      case 6: return 'Armor';
      default: return `Slot ${slot}`;
    }
  };

  const getSlotCategory = (slot: number) => {
    switch (slot) {
      case 1: return 'helmet';
      case 2: return 'weapon1';
      case 3: return 'weapon2';
      case 4: return 'boots';
      case 5: return 'trinket';
      case 6: return 'armor';
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'helmet': return '⛑️';
      case 'weapon1': return '⚔️';
      case 'weapon2': return '🗡️';
      case 'boots': return '👢';
      case 'trinket': return '💍';
      case 'armor': return '🛡️';
      default: return '❓';
    }
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
              gap: '0.75rem',
            }}>
              {[1, 2, 3, 4, 5, 6].map(slot => {
                const equippedItem = equipmentSummary?.equippedItems.find(
                  item => item.equipped_slot === slot
                );
                const concreteItem = equippedItem?.concrete_items;
                return (
                  <div
                    key={slot}
                    style={{
                      border: equippedItem ? `2px solid ${getRarityColor(equippedItem.rarity)}` : '2px solid #444',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      backgroundColor: equippedItem ? '#2a2a2a' : '#1a1a1a',
                      minHeight: '120px',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      fontSize: '11px',
                      color: '#888',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem',
                    }}>
                      {getSlotName(slot)}
                    </div>
                    {equippedItem && concreteItem ? (
                      <>
                        <div style={{
                          fontSize: '20px',
                          textAlign: 'center',
                          marginBottom: '0.5rem',
                        }}>
                          {getCategoryIcon(concreteItem.category)}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          marginBottom: '0.25rem',
                          fontWeight: 'bold',
                          color: '#fff',
                        }}>
                          {concreteItem.item_name}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: getRarityColor(equippedItem.rarity),
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}>
                          {equippedItem.rarity}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4CAF50', marginBottom: '0.5rem' }}>
                          +{equippedItem.damage_contribution} DMG
                        </div>
                        <button
                          onClick={() => handleUnequipItem(equippedItem.id)}
                          style={{
                            width: '100%',
                            padding: '0.4rem',
                            fontSize: '11px',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          Unequip
                        </button>
                      </>
                    ) : (
                      <div style={{
                        fontSize: '11px',
                        color: '#666',
                        textAlign: 'center',
                        marginTop: '1.5rem',
                      }}>
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
                unequippedItems.map(item => {
                  const concreteItem = item.concrete_items;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        border: `2px solid ${getRarityColor(item.rarity)}`,
                        borderRadius: '8px',
                        backgroundColor: '#2a2a2a',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <div style={{ fontSize: '32px' }}>
                          {concreteItem ? getCategoryIcon(concreteItem.category) : '❓'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 'bold',
                            fontSize: '15px',
                            marginBottom: '0.25rem',
                          }}>
                            {concreteItem?.item_name || 'Unknown Item'}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: getRarityColor(item.rarity),
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            marginBottom: '0.25rem',
                          }}>
                            {item.rarity}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#888',
                            textTransform: 'capitalize',
                            marginBottom: '0.25rem',
                          }}>
                            {concreteItem?.category || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>
                            +{item.damage_contribution} DMG
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        <button
                          onClick={() => openEquipModal(item.id)}
                          style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#2196F3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                          }}
                        >
                          Equip
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
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
      {itemToEquip && (() => {
        const selectedItem = items.find(i => i.id === itemToEquip);
        const selectedConcreteItem = selectedItem?.concrete_items;
        return (
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
              maxWidth: '500px',
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Equip Item</h3>
              {selectedItem && selectedConcreteItem && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#2a2a2a',
                  border: `2px solid ${getRarityColor(selectedItem.rarity)}`,
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '0.5rem' }}>
                    {getCategoryIcon(selectedConcreteItem.category)}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '0.25rem' }}>
                    {selectedConcreteItem.item_name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: getRarityColor(selectedItem.rarity),
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}>
                    {selectedItem.rarity}
                  </div>
                </div>
              )}
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '14px', color: '#888' }}>
                Select Equipment Slot
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}>
                {[1, 2, 3, 4, 5, 6].map(slot => {
                  const occupied = equipmentSummary?.equippedItems.some(
                    item => item.equipped_slot === slot
                  );
                  const slotCategory = getSlotCategory(slot);
                  const itemCategory = selectedConcreteItem?.category;
                  const canEquip = slotCategory === itemCategory;
                  const isDisabled = occupied || !canEquip;

                  return (
                    <button
                      key={slot}
                      onClick={() => canEquip && !occupied && handleEquipItem(itemToEquip, slot)}
                      disabled={isDisabled}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: isDisabled ? '#444' : '#4CAF50',
                        color: isDisabled ? '#888' : '#fff',
                        border: canEquip ? '2px solid #4CAF50' : '2px solid #666',
                        borderRadius: '6px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        opacity: isDisabled ? 0.5 : 1,
                      }}
                    >
                      <div style={{ marginBottom: '0.25rem' }}>{getSlotName(slot)}</div>
                      {occupied && <div style={{ fontSize: '9px' }}>(Occupied)</div>}
                      {!canEquip && !occupied && <div style={{ fontSize: '9px' }}>(Wrong Type)</div>}
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
                  fontWeight: 'bold',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* Gacha Confirmation Modal */}
      {showGachaConfirm && (
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
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Purchase Item Pack?</h3>
            <p style={{ marginBottom: '2rem', color: '#ccc' }}>
              This will cost 100 tokens. You will receive one random item.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleConfirmBuy}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Yes
              </button>
              <button
                onClick={handleCancelBuy}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gacha Card Selection Modal */}
      {showGachaSelection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <h2 style={{ marginBottom: '2rem', color: '#fff' }}>Select Your Card</h2>
          <div style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                onClick={() => handleCardSelect(index)}
                style={{
                  width: '200px',
                  height: '280px',
                  backgroundColor: selectedCardIndex === index ? '#4CAF50' : '#2a2a2a',
                  border: selectedCardIndex === index ? '3px solid #4CAF50' : '2px solid #444',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  transition: 'all 0.3s ease',
                  transform: selectedCardIndex === index ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedCardIndex === index ? '0 0 20px rgba(76, 175, 80, 0.5)' : 'none',
                }}
              >
                ?
              </div>
            ))}
          </div>
          <button
            onClick={handleConfirmSelection}
            disabled={selectedCardIndex === null}
            style={{
              padding: '1rem 3rem',
              backgroundColor: selectedCardIndex !== null ? '#4CAF50' : '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedCardIndex !== null ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            Confirm
          </button>
        </div>
      )}

      {/* Gacha Reveal Modal */}
      {showGachaReveal && revealedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <h2 style={{ marginBottom: '2rem', color: '#fff' }}>You Received!</h2>

          {/* Revealed Card */}
          <div style={{
            width: '250px',
            minHeight: '350px',
            backgroundColor: '#2a2a2a',
            border: `3px solid ${getRarityColor(revealedItem.rarity)}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: `0 0 30px ${getRarityColor(revealedItem.rarity)}80`,
          }}>
            <div style={{
              fontSize: '64px',
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              {getCategoryIcon(revealedItem.item.category)}
            </div>
            <div style={{
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#fff',
              }}>
                {revealedItem.item.item_name}
              </div>
              <div style={{
                fontSize: '14px',
                color: getRarityColor(revealedItem.rarity),
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}>
                {revealedItem.rarity}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#888',
                textTransform: 'capitalize',
                marginBottom: '1rem',
              }}>
                {revealedItem.item.category}
              </div>
              <div style={{
                fontSize: '24px',
                color: '#4CAF50',
                fontWeight: 'bold',
              }}>
                {revealedItem.item.dmg * (
                  revealedItem.rarity === 'common' ? 1 :
                  revealedItem.rarity === 'rare' ? 1.2 :
                  revealedItem.rarity === 'epic' ? 1.5 : 2
                )} DMG
              </div>
            </div>
          </div>

          {/* Other Cards */}
          {showOtherCards && (
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              {offeredItems.filter((_, idx) => idx !== selectedCardIndex).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '180px',
                    minHeight: '250px',
                    backgroundColor: '#2a2a2a',
                    border: `2px solid ${getRarityColor(item.rarity)}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    opacity: 0.7,
                  }}
                >
                  <div style={{
                    fontSize: '48px',
                    textAlign: 'center',
                    marginBottom: '0.5rem',
                  }}>
                    {getCategoryIcon(item.item.category)}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '0.25rem',
                      color: '#fff',
                    }}>
                      {item.item.item_name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: getRarityColor(item.rarity),
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem',
                    }}>
                      {item.rarity}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#888',
                      textTransform: 'capitalize',
                      marginBottom: '0.5rem',
                    }}>
                      {item.item.category}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      color: '#4CAF50',
                      fontWeight: 'bold',
                    }}>
                      {item.item.dmg * (
                        item.rarity === 'common' ? 1 :
                        item.rarity === 'rare' ? 1.2 :
                        item.rarity === 'epic' ? 1.5 : 2
                      )} DMG
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            {!showOtherCards && (
              <button
                onClick={handleShowOtherCards}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                Show Other Cards
              </button>
            )}
            <button
              onClick={handleCollect}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Collect
            </button>
          </div>
        </div>
      )}
    </>
  );
}
