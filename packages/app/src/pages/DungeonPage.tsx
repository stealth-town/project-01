import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { Navigation } from '../components/Navigation';
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
  tokens_earned: number;
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
  const [stats, setStats] = useState<{ totalDamage: number; totalTokens: number; totalRuns: number } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
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

  // Subscribe to real-time dungeon events
  useEffect(() => {
    if (!activeDungeon?.characterDungeon) return;

    console.log('Subscribing to dungeon events for:', activeDungeon.characterDungeon.id);

    const channel = supabaseClient
      .channel('dungeon-events')
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
          setCombatLog((prev) => [...prev, payload.new as DungeonEvent]);

          // Update total damage
          setActiveDungeon((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              characterDungeon: {
                ...prev.characterDungeon,
                total_damage_dealt: prev.characterDungeon.total_damage_dealt + (payload.new as DungeonEvent).damage_dealt,
                tokens_earned: prev.characterDungeon.tokens_earned + (payload.new as DungeonEvent).damage_dealt,
              },
            };
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeDungeon?.characterDungeon?.id]);

  // Calculate time remaining
  useEffect(() => {
    if (!activeDungeon?.dungeonRun) return;

    const interval = setInterval(() => {
      const startTime = new Date(activeDungeon.dungeonRun.started_at).getTime();
      const duration = activeDungeon.dungeonRun.duration_seconds * 1000;
      const endTime = startTime + duration;
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);

      setTimeRemaining(remaining);

      // Reload data when dungeon finishes
      if (remaining === 0) {
        setTimeout(() => loadData(), 1000);
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
      <>
        <Navigation />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading dungeon...</p>
        </div>
      </>
    );
  }

  if (!character) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No character found. Create a character first!</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gap: '2rem',
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Left Panel - Stats & Unclaimed Rewards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Stats Header */}
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#1a1a1a',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px' }}>All-Time Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '14px' }}>
              <div>
                <div style={{ color: '#888' }}>Total Runs</div>
                <div style={{ fontWeight: 'bold' }}>{stats?.totalRuns || 0}</div>
              </div>
              <div>
                <div style={{ color: '#888' }}>Total Damage</div>
                <div style={{ fontWeight: 'bold', color: '#f44336' }}>{stats?.totalDamage || 0}</div>
              </div>
            </div>
          </div>

          {/* Unclaimed Rewards */}
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#1a1a1a',
            flex: 1,
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px' }}>Unclaimed Rewards</h3>

            {unclaimedDungeons.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '2rem 0' }}>
                No rewards to claim
              </p>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '1rem',
                }}>
                  {unclaimedDungeons.map((dungeon) => (
                    <div
                      key={dungeon.id}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        backgroundColor: '#2a2a2a',
                      }}
                    >
                      <div style={{ fontSize: '14px', marginBottom: '0.5rem' }}>
                        <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                          {dungeon.tokens_earned} 🪙
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {dungeon.total_damage_dealt} damage
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaimReward(dungeon.id)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Claim
                      </button>
                    </div>
                  ))}
                </div>

                {unclaimedDungeons.length > 1 && (
                  <button
                    onClick={handleClaimAll}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#2196F3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Claim All ({unclaimedDungeons.reduce((sum, d) => sum + d.tokens_earned, 0)} 🪙)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Center - Dungeon Status & Combat Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Active Dungeon Header */}
          {activeDungeon ? (
            <div style={{
              border: '2px solid #4CAF50',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#1a1a1a',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px' }}>Dungeon Active</h2>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#888', fontSize: '14px' }}>
                    DR: {activeDungeon.characterDungeon.starting_damage_rating}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>remaining</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Damage Dealt</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                    {activeDungeon.characterDungeon.total_damage_dealt}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Tokens Earned</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFC107' }}>
                    {activeDungeon.characterDungeon.tokens_earned} 🪙
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              border: '2px solid #666',
              borderRadius: '8px',
              padding: '2rem',
              backgroundColor: '#1a1a1a',
              textAlign: 'center',
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>No Active Dungeon</h2>
              <p style={{ color: '#888', margin: 0 }}>
                {character.damage_rating === 0
                  ? 'Equip items to increase your damage rating and join the next dungeon!'
                  : 'You will join the next dungeon cycle automatically.'}
              </p>
            </div>
          )}

          {/* Combat Log */}
          <div style={{
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#1a1a1a',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Combat Log</h3>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '1rem',
              minHeight: '400px',
              maxHeight: '500px',
              fontFamily: 'monospace',
              fontSize: '14px',
            }}>
              {combatLog.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', margin: '2rem 0' }}>
                  {activeDungeon ? 'Waiting for combat events...' : 'No active dungeon'}
                </p>
              ) : (
                <>
                  {combatLog.map((event) => (
                    <div key={event.id} style={{ marginBottom: '0.5rem', color: '#f44336' }}>
                      <span style={{ color: '#888' }}>[{formatTimestamp(event.created_at)}]</span>
                      {' '}You hit for <span style={{ fontWeight: 'bold', color: '#f44336' }}>{event.damage_dealt}</span> damage
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
