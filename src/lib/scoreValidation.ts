/**
 * Score Validation & Anti-Cheat Logic for Stickwar
 * As required by PRD Section 3 (Edge Functions & Anti-Cheat Validation)
 * Validates combat telemetry before score submission to Supabase leaderboard.
 */

export interface StageCombatTelemetry {
  stageId: number;
  worldId: number;
  timeTakenSeconds: number;
  damageReceived: number;
  enemiesDefeated: number;
  maxCombo: number;
  characterId: string;
  claimedScore: number;
  coinsEarned: number;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedScore: number;
  reason?: string;
  antiCheatToken: string;
}

export function validateStageScore(telemetry: StageCombatTelemetry): ValidationResult {
  const {
    stageId,
    worldId,
    timeTakenSeconds,
    damageReceived,
    enemiesDefeated,
    maxCombo,
    claimedScore,
    coinsEarned,
  } = telemetry;

  // 1. Structural Range Checks
  if (worldId < 1 || worldId > 4 || stageId < 1 || stageId > 5) {
    return {
      isValid: false,
      sanitizedScore: 0,
      reason: 'Invalid stage or world coordinate',
      antiCheatToken: '',
    };
  }

  // 2. Minimum Time Elapsed Check (A stage cannot be legitimately cleared in under 4 seconds)
  const isBossStage = stageId === 5;
  const minLegitimateSeconds = isBossStage ? 6.0 : 4.5;
  if (timeTakenSeconds < minLegitimateSeconds) {
    return {
      isValid: false,
      sanitizedScore: 0,
      reason: 'Stage completed in mathematically impossible timeframe',
      antiCheatToken: '',
    };
  }

  // 3. Realistic Enemy Kill Cap
  // Stage waves range from 6 to 25 enemies max
  const maxPossibleEnemies = isBossStage ? 18 : 25;
  if (enemiesDefeated > maxPossibleEnemies || enemiesDefeated < 1) {
    return {
      isValid: false,
      sanitizedScore: 0,
      reason: 'Enemies defeated exceeds wave spawn capacity',
      antiCheatToken: '',
    };
  }

  // 4. Score Math Recalculation & Cap
  // Base kill points: 250 - 500 per enemy
  // Combo multiplier bonus: combo * 50
  // Time bonus: max(0, 300 - time) * 10
  // No damage bonus: 2000
  const estimatedKillScore = enemiesDefeated * 450;
  const estimatedComboBonus = Math.min(maxCombo, 50) * 80;
  const estimatedTimeBonus = Math.max(0, Math.floor(180 - timeTakenSeconds)) * 25;
  const noDamageBonus = damageReceived === 0 ? 2500 : 0;
  const theoreticalMaxScore = estimatedKillScore + estimatedComboBonus + estimatedTimeBonus + noDamageBonus + 3000;

  if (claimedScore > theoreticalMaxScore) {
    return {
      isValid: false,
      sanitizedScore: theoreticalMaxScore,
      reason: 'Claimed score exceeds theoretical ceiling for this stage',
      antiCheatToken: '',
    };
  }

  // 5. Coin Generation Validation
  const maxPossibleCoins = (enemiesDefeated * 15) + (isBossStage ? 200 : 100);
  if (coinsEarned > maxPossibleCoins) {
    return {
      isValid: false,
      sanitizedScore: claimedScore,
      reason: 'Coin yield exceeds stage budget',
      antiCheatToken: '',
    };
  }

  // 6. Generate cryptographic-style Anti-Cheat Verification Hash
  const hashSeed = `${worldId}:${stageId}:${claimedScore}:${Math.round(timeTakenSeconds * 10)}:${enemiesDefeated}:stickwar_v1`;
  const token = btoa(hashSeed);

  return {
    isValid: true,
    sanitizedScore: claimedScore,
    antiCheatToken: token,
  };
}
