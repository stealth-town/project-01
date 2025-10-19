import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { Layout } from '../components/Layout';
import type { UserBalances } from '@stealth-town/shared/types';

interface Character {
  id: string;
  user_id: string;
  damage_rating: number;
  created_at: string;
  updated_at: string;
}

interface ConcreteItem {
  id: number;
  category: string;
  item_name: string;
  dmg: number;
}

interface Item {
  id: string;
  character_id: string;
  concrete_item_id: number;
  rarity: string;
  damage_contribution: number;
  is_equipped: boolean;
  equipped_slot?: number;
  created_at: string;
  updated_at: string;
  concrete_items?: ConcreteItem;
}

interface EquipmentSummary {
  equippedItems: Item[];
  totalDamageContribution: number;
  totalItemCount: number;
  inventoryCount: number;
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
  const [showGachaSelection, setShowGachaSelection] = useState(false);
  const [showGachaReveal, setShowGachaReveal] = useState(false);
  const [offeredItems, setOfferedItems] = useState<any[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [revealedItem, setRevealedItem] = useState<any>(null);
  const [revealedOtherCards, setRevealedOtherCards] = useState<Set<number>>(new Set());

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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
      const response = await apiClient.initiateGacha(character.id, user.id);
      setOfferedItems(response.offeredItems);
      setShowGachaSelection(true);
      setSelectedCardIndex(null);
    } catch (err: any) {
      alert(err.message || 'Failed to initiate gacha');
    }
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
      setRevealedOtherCards(new Set());
    } catch (err: any) {
      alert(err.message || 'Failed to confirm selection');
      setShowGachaSelection(false);
      setOfferedItems([]);
      setSelectedCardIndex(null);
    }
  };

  const handleRevealOtherCard = (index: number) => {
    setRevealedOtherCards(prev => new Set([...prev, index]));
  };

  const handleCollect = async () => {
    setShowGachaReveal(false);
    setRevealedItem(null);
    setOfferedItems([]);
    setSelectedCardIndex(null);
    setRevealedOtherCards(new Set());
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

  const openDeleteModal = (itemId: string) => {
    setItemToDelete(itemId);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await apiClient.deleteItem(itemToDelete);
      setItemToDelete(null);
      await loadCharacterData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
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
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading character...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  if (!character) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No character found. Create one first!</p>
        </div>
      </Layout>
    );
  }

  const unequippedItems = items.filter(item => !item.is_equipped);

  return (
    <Layout>
      <div style={{
        width: '80%',
        margin: '0 auto',
        display: 'flex',
        gap: '2rem',
        padding: '2rem 0',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Left Column - Character */}
        <div style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflow: 'auto',
        }}>
          {/* Damage Rating */}
          <div style={{
            border: '2px solid #4CAF50',
            borderRadius: '8px',
            padding: '1.5rem',
            backgroundColor: '#1a1a1a',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '0.5rem' }}>
              DAMAGE RATING
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4CAF50' }}>
              {character.damage_rating}
            </div>
          </div>

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
        </div>

        {/* Right Column - Buy Item + Inventory */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflow: 'hidden',
        }}>
          {/* Buy Item Button - Highlighted */}
          <button
            onClick={handleBuyItem}
            disabled={!balances || balances.tokens < 100}
            style={{
              padding: '1.5rem',
              backgroundColor: balances && balances.tokens >= 100 ? '#4CAF50' : '#666',
              color: '#fff',
              border: balances && balances.tokens >= 100 ? '3px solid #81C784' : 'none',
              borderRadius: '12px',
              cursor: balances && balances.tokens >= 100 ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: balances && balances.tokens >= 100 ? '0 0 20px rgba(76, 175, 80, 0.5)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            Buy Item
            <br />
            (100 🪙)
          </button>
          {balances && balances.tokens < 100 && (
            <p style={{ fontSize: '12px', color: '#f44336', textAlign: 'center', marginTop: '-0.5rem' }}>
              Not enough tokens
            </p>
          )}

          {/* Inventory */}
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: '#1a1a1a',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Inventory Topbar */}
            <div style={{
              padding: '1rem',
              borderBottom: '2px solid #333',
              backgroundColor: '#2a2a2a',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                Inventory ({unequippedItems.length}/20)
              </h3>
            </div>

            {/* Inventory List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
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
                          onClick={() => openDeleteModal(item.id)}
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

          {/* All 3 Cards in Original Positions */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            {[0, 1, 2].map((index) => {
              const isSelected = index === selectedCardIndex;
              const isRevealed = isSelected || revealedOtherCards.has(index);
              const item = offeredItems[index];

              if (isRevealed && item) {
                // Show revealed card
                return (
                  <div
                    key={index}
                    style={{
                      width: isSelected ? '250px' : '220px',
                      minHeight: isSelected ? '350px' : '310px',
                      backgroundColor: '#2a2a2a',
                      border: `3px solid ${getRarityColor(item.rarity)}`,
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: isSelected ? `0 0 30px ${getRarityColor(item.rarity)}80` : 'none',
                      opacity: isSelected ? 1 : 0.7,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{
                      fontSize: isSelected ? '64px' : '48px',
                      textAlign: 'center',
                      marginBottom: '1rem',
                    }}>
                      {getCategoryIcon(item.item.category)}
                    </div>
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '1rem',
                    }}>
                      <div style={{
                        fontSize: isSelected ? '18px' : '14px',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#fff',
                      }}>
                        {item.item.item_name}
                      </div>
                      <div style={{
                        fontSize: isSelected ? '14px' : '12px',
                        color: getRarityColor(item.rarity),
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                      }}>
                        {item.rarity}
                      </div>
                      <div style={{
                        fontSize: isSelected ? '12px' : '10px',
                        color: '#888',
                        textTransform: 'capitalize',
                        marginBottom: '1rem',
                      }}>
                        {item.item.category}
                      </div>
                      <div style={{
                        fontSize: isSelected ? '24px' : '18px',
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
                );
              } else {
                // Show hidden card with "click to reveal"
                return (
                  <div
                    key={index}
                    onClick={() => handleRevealOtherCard(index)}
                    style={{
                      width: '220px',
                      minHeight: '310px',
                      backgroundColor: '#2a2a2a',
                      border: '2px solid #444',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      opacity: 0.5,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                      e.currentTarget.style.borderColor = '#666';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.5';
                      e.currentTarget.style.borderColor = '#444';
                    }}
                  >
                    <div style={{
                      fontSize: '64px',
                      marginBottom: '1rem',
                    }}>
                      ?
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#888',
                      textAlign: 'center',
                    }}>
                      Click to reveal
                    </div>
                  </div>
                );
              }
            })}
          </div>

          <button
            onClick={handleCollect}
            style={{
              padding: '1rem 3rem',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            Collect
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (() => {
        const itemToDeleteData = items.find(i => i.id === itemToDelete);
        const concreteItem = itemToDeleteData?.concrete_items;
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
              maxWidth: '400px',
              textAlign: 'center',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#f44336' }}>Delete Item?</h3>

              {itemToDeleteData && concreteItem && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#2a2a2a',
                  border: `2px solid ${getRarityColor(itemToDeleteData.rarity)}`,
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '0.5rem' }}>
                    {getCategoryIcon(concreteItem.category)}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '0.25rem' }}>
                    {concreteItem.item_name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: getRarityColor(itemToDeleteData.rarity),
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}>
                    {itemToDeleteData.rarity}
                  </div>
                  <div style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>
                    +{itemToDeleteData.damage_contribution} DMG
                  </div>
                </div>
              )}

              <p style={{ marginBottom: '2rem', color: '#ccc' }}>
                This action cannot be undone. Are you sure?
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={handleCancelDelete}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
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
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
}
