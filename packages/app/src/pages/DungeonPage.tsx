import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { Layout } from '../components/Layout';
import { supabaseClient } from '@stealth-town/shared/supabase';

interface DungeonEvent {
  id: string;
  character_dungeon_id: string;
  damage_dealt: number;
  created_at: string;
}

interface CharacterDungeon {
  id: string;
  character_id: string;
  dungeon_run_id: string;
  user_id: string;
  starting_damage_rating: number;
  total_damage_dealt: number;
  usdc_earned: number;
  joined_at: string;
  finished_at: string | null;
  claimed_at: string | null;
}

interface DungeonRun {
  id: string;
  started_at: string;
  duration_seconds: number;
  finished_at: string | null;
}

export function DungeonPage() {
  const { user } = useAuth();
  const [character, setCharacter] = useState<any>(null);
  const [activeDungeon, setActiveDungeon] = useState<{
    characterDungeon: CharacterDungeon;
    dungeonRun: DungeonRun;
  } | null>(null);
  const [combatLog, setCombatLog] = useState<DungeonEvent[]>([]);
  const [unclaimedDungeons, setUnclaimedDungeons] = useState<CharacterDungeon[]>([]);
  const [stats, setStats] = useState<{ totalDamage: number; totalUsdc: number; totalRuns: number } | null>(null);
  const [nextDungeonTime, setNextDungeonTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll combat log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLog]);

  // Load character and dungeon data
  const loadData = async () => {
    if (!user?.id) return;

    try {
      // Get character
      const charData = await apiClient.getCharacterByUserId(user.id);
      setCharacter(charData.character);

      if (!charData.character) {
        setIsLoading(false);
        return;
      }

      // Load all dungeon data in parallel
      const [activeStatus, unclaimed, statsData] = await Promise.all([
        apiClient.getActiveDungeonStatus(charData.character.id),
        apiClient.getUnclaimedDungeons(charData.character.id),
        apiClient.getCharacterDungeonStats(charData.character.id),
      ]);

      setActiveDungeon(activeStatus.active ? activeStatus : null);
      setUnclaimedDungeons(unclaimed.dungeons);
      setStats(statsData);

      // If there's an active dungeon, load combat log
      if (activeStatus.active && activeStatus.characterDungeon) {
        const eventsData = await apiClient.getDungeonEvents(activeStatus.characterDungeon.id);
        setCombatLog(eventsData.events);
      } else {
        setCombatLog([]); // Clear log if no active dungeon
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading dungeon data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Subscribe to dungeon_runs for new dungeon detection
  useEffect(() => {
    if (!character) return;

    console.log('Subscribing to dungeon_runs for new dungeon detection');

    const dungeonRunsChannel = supabaseClient
      .channel('dungeon-runs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dungeon_runs',
        },
        (payload) => {
          console.log('New dungeon run started:', payload);
          // Reload all data when a new dungeon starts
          setTimeout(() => loadData(), 500);
        }
      )
      .subscribe((status) => {
        console.log('Dungeon runs subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from dungeon_runs');
      dungeonRunsChannel.unsubscribe();
    };
  }, [character?.id]);

  // Subscribe to real-time dungeon events and character dungeon updates
  useEffect(() => {
    if (!activeDungeon?.characterDungeon) return;

    console.log('Subscribing to dungeon events for:', activeDungeon.characterDungeon.id);

    const channel = supabaseClient
      .channel(`dungeon-realtime-${activeDungeon.characterDungeon.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dungeon_events',
          filter: `character_dungeon_id=eq.${activeDungeon.characterDungeon.id}`,
        },
        (payload) => {
          console.log('New dungeon event:', payload);
          const newEvent = payload.new as DungeonEvent;

          // Add new event to combat log
          setCombatLog((prev) => {
            // Prevent duplicates
            if (prev.some(e => e.id === newEvent.id)) return prev;
            return [...prev, newEvent];
          });

          // Update total damage and USDC (0.01 USDC per 1 damage)
          setActiveDungeon((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              characterDungeon: {
                ...prev.characterDungeon,
                total_damage_dealt: prev.characterDungeon.total_damage_dealt + newEvent.damage_dealt,
                usdc_earned: prev.characterDungeon.usdc_earned + (newEvent.damage_dealt * 0.01),
              },
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'character_dungeons',
          filter: `id=eq.${activeDungeon.characterDungeon.id}`,
        },
        (payload) => {
          console.log('Character dungeon updated:', payload);
          const updated = payload.new as CharacterDungeon;

          // Update character dungeon data
          setActiveDungeon((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              characterDungeon: updated,
            };
          });

          // If dungeon finished, reload all data
          if (updated.finished_at && !activeDungeon.characterDungeon.finished_at) {
            console.log('Dungeon finished, reloading data...');
            setTimeout(() => loadData(), 1000);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from dungeon realtime');
      channel.unsubscribe();
    };
  }, [activeDungeon?.characterDungeon?.id]);

  // Calculate time remaining for active dungeon AND next dungeon timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeDungeon?.dungeonRun) {
        const startTime = new Date(activeDungeon.dungeonRun.started_at).getTime();
        const duration = activeDungeon.dungeonRun.duration_seconds * 1000;
        const endTime = startTime + duration;
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);

        setNextDungeonTime(remaining); // Next dungeon starts when current ends

        // Reload data when dungeon finishes
        if (remaining === 0) {
          setTimeout(() => loadData(), 1000);
        }
      } else {
        // No active dungeon - estimate next based on 3-minute cycles
        const cycleTime = 3 * 60 * 1000; // 3 minutes
        const now = Date.now();
        const minuteMs = 60 * 1000;
        const timeInCurrentMinute = now % minuteMs;
        const minutesToNextCycle = 3 - (Math.floor(now / minuteMs) % 3);
        const timeToNext = (minutesToNextCycle * minuteMs) - timeInCurrentMinute;
        setNextDungeonTime(timeToNext > 0 ? timeToNext : cycleTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeDungeon?.dungeonRun]);

  // Claim single reward
  const handleClaimReward = async (characterDungeonId: string) => {
    if (!user) return;

    try {
      await apiClient.claimDungeonReward(characterDungeonId, user.id);
      await loadData(); // Refresh data
    } catch (error: any) {
      alert(error.message || 'Failed to claim reward');
    }
  };

  // Claim all rewards
  const handleClaimAll = async () => {
    if (!user || !character) return;

    try {
      await apiClient.claimAllDungeonRewards(character.id, user.id);
      await loadData(); // Refresh data
    } catch (error: any) {
      alert(error.message || 'Failed to claim all rewards');
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading dungeon...</p>
        </div>
      </Layout>
    );
  }

  if (!character) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No character found. Create a character first!</p>
        </div>
      </Layout>
    );
  }

  const totalUnclaimedUsdc = unclaimedDungeons.reduce((sum, d) => sum + d.usdc_earned, 0);
  const hasUnclaimedRewards = unclaimedDungeons.length > 0;

  return (
    <Layout>
      <div style={{
        display: 'flex',
        height: '100%', // Layout component handles navigation height
        overflow: 'hidden', // No page scrolling
        padding: '0.75rem',
        gap: '0.75rem',
        width: '80%',
        margin: '0 auto',
      }}>
        {/* Main Column - Left (Dungeon Timer, Active Dungeon, Combat Log, Claim Button) */}
        <div style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          minWidth: 0, // Prevent flex item from overflowing
        }}>
          {/* Next Dungeon Timer */}
          <div style={{
            border: '2px solid #FFC107',
            borderRadius: '8px',
            padding: '0.75rem',
            backgroundColor: '#1a1a1a',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '0.25rem' }}>
              Next Dungeon Starts In
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFC107' }}>
              {formatTime(nextDungeonTime)}
            </div>
          </div>

          {/* Active Dungeon Status */}
          {activeDungeon ? (
            <div style={{
              border: '2px solid #4CAF50',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#1a1a1a',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Dungeon Active</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#888', fontSize: '13px' }}>
                    DR: {activeDungeon.characterDungeon.starting_damage_rating}
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '0.25rem' }}>Damage Dealt</div>
                  <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#f44336' }}>
                    {activeDungeon.characterDungeon.total_damage_dealt}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '0.25rem' }}>USDC Earned</div>
                  <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#4CAF50' }}>
                    ${activeDungeon.characterDungeon.usdc_earned.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              border: '2px solid #666',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: '#1a1a1a',
              textAlign: 'center',
              flexShrink: 0,
            }}>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '18px' }}>No Active Dungeon</h2>
              <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>
                {character.damage_rating === 0
                  ? 'Equip items to increase your damage rating and join the next dungeon!'
                  : 'You will join the next dungeon cycle automatically.'}
              </p>
            </div>
          )}

          {/* Combat Log - Scrollable */}
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '0.75rem',
            backgroundColor: '#1a1a1a',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0, // Important for flex scrolling
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '15px', flexShrink: 0 }}>Combat Log</h3>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '0.75rem',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}>
              {combatLog.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', margin: '2rem 0' }}>
                  {activeDungeon ? 'Waiting for combat events...' : 'No active dungeon'}
                </p>
              ) : (
                <>
                  {combatLog.map((event) => (
                    <div key={event.id} style={{ marginBottom: '0.25rem', color: '#f44336' }}>
                      <span style={{ color: '#888' }}>[{formatTimestamp(event.created_at)}]</span>
                      {' '}You hit for <span style={{ fontWeight: 'bold', color: '#f44336' }}>{event.damage_dealt}</span> damage
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Claim All Button */}
          {hasUnclaimedRewards && (
            <button
              onClick={handleClaimAll}
              style={{
                width: '100%',
                padding: '1.25rem',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '18px',
                boxShadow: '0 4px 6px rgba(33, 150, 243, 0.3)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1976D2';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(33, 150, 243, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2196F3';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(33, 150, 243, 0.3)';
              }}
            >
              Claim All Rewards - ${totalUnclaimedUsdc.toFixed(2)} USDC
            </button>
          )}
        </div>

        {/* Right Sidebar - Stats + Unclaimed Rewards */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#1a1a1a',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* Stats Header */}
          <div style={{
            padding: '0.75rem',
            borderBottom: '1px solid #333',
            backgroundColor: '#222',
            flexShrink: 0,
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#FFC107' }}>All-Time Stats</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              fontSize: '12px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '10px' }}>Runs</div>
                <div style={{ fontWeight: 'bold' }}>{stats?.totalRuns || 0}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '10px' }}>Damage</div>
                <div style={{ fontWeight: 'bold', color: '#f44336' }}>{stats?.totalDamage || 0}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '10px' }}>USDC</div>
                <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>${stats?.totalUsdc.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>

          {/* Unclaimed Rewards List - Scrollable */}
          <div style={{
            padding: '0.75rem',
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px' }}>Unclaimed Rewards</h3>

            {unclaimedDungeons.length === 0 ? (
              <p style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '2rem 0' }}>
                No rewards to claim
              </p>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                {unclaimedDungeons.map((dungeon) => (
                  <div
                    key={dungeon.id}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      backgroundColor: '#2a2a2a',
                    }}
                  >
                    <div style={{ fontSize: '13px', marginBottom: '0.5rem' }}>
                      <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                        ${dungeon.usdc_earned.toFixed(2)} USDC
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {dungeon.total_damage_dealt} damage
                      </div>
                    </div>
                    <button
                      onClick={() => handleClaimReward(dungeon.id)}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      Claim
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Query for Responsive Layout */}
      <style>{`
        @media (max-width: 1024px) {
          div[style*="display: flex"][style*="height: 100%"] {
            flex-direction: column !important;
            height: auto !important;
            overflow-y: auto !important;
          }
          div[style*="width: 320px"] {
            width: 100% !important;
          }
        }
      `}</style>
    </Layout>
  );
}
