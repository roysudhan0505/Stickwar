import { supabase, isSupabaseConfigured } from './supabase';
import { GameState, LeaderboardEntry } from '../types/game';
import { validateStageScore, StageCombatTelemetry } from './scoreValidation';

export interface CloudSyncStatus {
  lastSyncedAt: Date | null;
  syncing: boolean;
  error: string | null;
}

/**
 * Uploads current player state to Supabase (Profiles, Stage Progress, Character Inventory, Achievements).
 */
export async function syncGameStateToCloud(
  state: GameState,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { player, stages, characters, achievements } = state;

    // 1. Upsert Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: player.username,
        avatar: player.avatar,
        total_kills: player.totalKills,
        stages_cleared: player.stagesCleared,
        gold_coins: player.goldCoins,
        rank: player.rank,
        updated_at: new Date().toISOString(),
      });

    if (profileError) console.warn('Profile sync error:', profileError.message);

    // 2. Upsert Stage Progress
    const stageRecords = Object.values(stages).map((st) => ({
      user_id: userId,
      world_id: st.worldId,
      stage_id: st.stageId,
      stars: st.stars,
      best_score: st.bestScore,
      best_time: st.bestTime || 0,
      completed: st.completed,
      updated_at: new Date().toISOString(),
    }));

    if (stageRecords.length > 0) {
      await supabase.from('stage_progress').upsert(stageRecords, {
        onConflict: 'user_id,world_id,stage_id',
      });
    }

    // 3. Upsert Character Inventory
    const characterRecords = Object.values(characters).map((char) => ({
      user_id: userId,
      character_id: char.id,
      unlocked: char.unlocked,
      shards: char.shards,
      atk_tier: char.upgrades.attackTier,
      def_tier: char.upgrades.defenseTier,
      spd_tier: char.upgrades.speedTier,
      ability_tier: char.upgrades.abilityTier,
      updated_at: new Date().toISOString(),
    }));

    if (characterRecords.length > 0) {
      await supabase.from('character_inventory').upsert(characterRecords, {
        onConflict: 'user_id,character_id',
      });
    }

    // 4. Upsert Achievements
    const achievementRecords = achievements.map((ach) => ({
      user_id: userId,
      achievement_id: ach.id,
      progress: ach.progress,
      claimed: ach.claimed,
      updated_at: new Date().toISOString(),
    }));

    if (achievementRecords.length > 0) {
      await supabase.from('achievements').upsert(achievementRecords, {
        onConflict: 'user_id,achievement_id',
      });
    }

    // 5. Update Leaderboard Total Score
    const totalScore = Object.values(stages).reduce((sum, st) => sum + st.bestScore, 0);
    const bestBossTime = stages['1-5']?.bestTime || 30.0;

    await supabase.from('leaderboard_scores').upsert({
      user_id: userId,
      username: player.username,
      avatar: player.avatar,
      total_score: totalScore,
      stages_cleared: player.stagesCleared,
      best_boss_clear_time: bestBossTime,
      weekly_score: totalScore,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    console.error('Failed to sync game state to Supabase:', message);
    return { success: false, error: message };
  }
}

/**
 * Downloads player data from Supabase and reconciles with local state.
 */
export async function loadGameStateFromCloud(
  userId: string,
  currentState: GameState
): Promise<{ state: GameState | null; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { state: null, error: 'Supabase is not configured' };
  }

  try {
    // 1. Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // 2. Fetch Stage Progress
    const { data: stageRows } = await supabase
      .from('stage_progress')
      .select('*')
      .eq('user_id', userId);

    // 3. Fetch Character Inventory
    const { data: charRows } = await supabase
      .from('character_inventory')
      .select('*')
      .eq('user_id', userId);

    // 4. Fetch Achievements
    const { data: achRows } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId);

    const mergedState: GameState = { ...currentState };

    if (profile) {
      mergedState.player = {
        ...mergedState.player,
        username: profile.username || mergedState.player.username,
        avatar: profile.avatar || mergedState.player.avatar,
        goldCoins: Math.max(profile.gold_coins ?? 0, mergedState.player.goldCoins),
        totalKills: Math.max(profile.total_kills ?? 0, mergedState.player.totalKills),
        stagesCleared: Math.max(profile.stages_cleared ?? 0, mergedState.player.stagesCleared),
        rank: profile.rank || mergedState.player.rank,
        isGuest: false,
      };
    }

    if (stageRows && stageRows.length > 0) {
      stageRows.forEach((row) => {
        const key = `${row.world_id}-${row.stage_id}`;
        if (mergedState.stages[key]) {
          mergedState.stages[key] = {
            ...mergedState.stages[key],
            stars: Math.max(row.stars || 0, mergedState.stages[key].stars),
            bestScore: Math.max(row.best_score || 0, mergedState.stages[key].bestScore),
            bestTime: row.best_time || mergedState.stages[key].bestTime,
            completed: row.completed || mergedState.stages[key].completed,
            unlocked: true,
          };
        }
      });
    }

    if (charRows && charRows.length > 0) {
      charRows.forEach((row) => {
        const c = mergedState.characters[row.character_id];
        if (c) {
          mergedState.characters[row.character_id] = {
            ...c,
            unlocked: row.unlocked ?? c.unlocked,
            shards: Math.max(row.shards ?? 0, c.shards),
            upgrades: {
              attackTier: Math.max(row.atk_tier ?? 0, c.upgrades.attackTier),
              defenseTier: Math.max(row.def_tier ?? 0, c.upgrades.defenseTier),
              speedTier: Math.max(row.spd_tier ?? 0, c.upgrades.speedTier),
              abilityTier: Math.max(row.ability_tier ?? 0, c.upgrades.abilityTier),
            },
          };
        }
      });
    }

    if (achRows && achRows.length > 0) {
      mergedState.achievements = mergedState.achievements.map((localAch) => {
        const remote = achRows.find((r) => r.achievement_id === localAch.id);
        if (remote) {
          return {
            ...localAch,
            progress: Math.max(remote.progress || 0, localAch.progress),
            claimed: remote.claimed ?? localAch.claimed,
          };
        }
        return localAch;
      });
    }

    return { state: mergedState };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown load error';
    return { state: null, error: message };
  }
}

/**
 * Validates and records combat score to Supabase Leaderboard with Anti-Cheat validation.
 */
export async function submitScoreToLeaderboard(
  userId: string,
  username: string,
  avatar: string,
  telemetry: StageCombatTelemetry
): Promise<{ success: boolean; sanitizedScore: number; reason?: string }> {
  // Step 1: Run Anti-Cheat validation
  const validation = validateStageScore(telemetry);
  if (!validation.isValid) {
    console.warn('Anti-Cheat rejected score submission:', validation.reason);
    return { success: false, sanitizedScore: validation.sanitizedScore, reason: validation.reason };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: true, sanitizedScore: validation.sanitizedScore };
  }

  try {
    // Step 2: Fetch current score record
    const { data: existing } = await supabase
      .from('leaderboard_scores')
      .select('total_score, weekly_score, stages_cleared, best_boss_clear_time')
      .eq('user_id', userId)
      .maybeSingle();

    const currentTotal = existing?.total_score || 0;
    const currentWeekly = existing?.weekly_score || 0;
    const newTotal = currentTotal + validation.sanitizedScore;
    const newWeekly = currentWeekly + validation.sanitizedScore;

    const currentBestBoss = existing?.best_boss_clear_time || 999;
    const bestBossTime = telemetry.stageId === 5 
      ? Math.min(currentBestBoss, telemetry.timeTakenSeconds) 
      : currentBestBoss;

    await supabase.from('leaderboard_scores').upsert({
      user_id: userId,
      username,
      avatar,
      total_score: newTotal,
      weekly_score: newWeekly,
      best_boss_clear_time: bestBossTime,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

    return { success: true, sanitizedScore: validation.sanitizedScore };
  } catch (err: unknown) {
    console.error('Failed to submit score to leaderboard:', err);
    return { success: true, sanitizedScore: validation.sanitizedScore };
  }
}

/**
 * Fetches real-time leaderboard scores from Supabase.
 */
export async function fetchLeaderboardScores(
  tab: 'global' | 'weekly' | 'friends',
  friendIds: string[] = []
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    let query = supabase.from('leaderboard_scores').select('*');

    if (tab === 'weekly') {
      query = query.order('weekly_score', { ascending: false });
    } else if (tab === 'friends' && friendIds.length > 0) {
      query = query.in('user_id', friendIds).order('total_score', { ascending: false });
    } else {
      query = query.order('total_score', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    if (!data) return [];

    return data.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      avatar: (row.avatar as 'basic' | 'ninja' | 'mage' | 'tank' | 'sky') || 'ninja',
      score: tab === 'weekly' ? (row.weekly_score ?? row.total_score) : row.total_score,
      stagesCleared: row.stages_cleared || 1,
      bestBossTime: row.best_boss_clear_time ? `${row.best_boss_clear_time.toFixed(1)}s` : 'N/A',
    }));
  } catch (err) {
    console.warn('Error fetching Supabase leaderboard:', err);
    return [];
  }
}
