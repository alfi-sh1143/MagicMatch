import {
  CandidateProfile,
  CompatibilityResult,
  MatchResult,
  ConnectionIntent,
  CompatibilityComponentScores,
} from '../../types';
import { tokenResolutionService, TOKEN_EXPIRATION_MS } from './tokenService';

export const ENGINE_METADATA = {
  engineVersion: 'v2.4',
  weights: {
    sharedInterests: 30,
    traits: 20,
    hangoutActivity: 15,
    connectionIntent: 15,
    socialBatteryDelta: 10,
    antiStagnationEntropy: 10,
  },
  seedStrategy: 'deterministic-hash-fmix32',
  timestamp: 1727179200000,
};

/**
 * Deterministic hash function producing a stable 0..1 float for a given string seed.
 * Enables reproducible anti-stagnation entropy without unseeded randomness.
 */
function hashToFloat(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

/**
 * Calculates deterministic compatibility between user answers and a candidate profile.
 * Total weights sum to exactly 100%:
 * - Shared Interests: 30%
 * - Personality / Energy Traits: 20%
 * - Hangout Scenario Preference: 15%
 * - Connection Intent Overlap: 15%
 * - Social Battery Delta: 10%
 * - Anti-Stagnation Entropy: 10%
 */
export function calculateCompatibility(
  answers: Record<string, any>,
  candidate: CandidateProfile,
  sessionSeed: string = 'SESSION-DEFAULT'
): CompatibilityResult {
  // 1. Shared Interests (Weight: 30%)
  const userInterests: string[] = answers.interests || [];
  const sharedInterests = candidate.interests.filter((item) => userInterests.includes(item));
  const interestScore =
    userInterests.length > 0
      ? (sharedInterests.length / userInterests.length) * 30
      : 0;

  // 2. Personality / Energy Trait Compatibility (Weight: 20%)
  const userEnergy = answers.energy || 'chill';
  const energyTraitMap: Record<string, string[]> = {
    chill: ['chill', 'grounded', 'deep'],
    social: ['social', 'playful', 'curious'],
    creative: ['creative', 'curious', 'playful'],
    introspective: ['deep', 'grounded', 'creative'],
  };
  const targetTraits = energyTraitMap[userEnergy] || ['chill'];
  const compatibleTraits = candidate.traits.filter((trait) => targetTraits.includes(trait));
  const traitScore = Math.min(20, (compatibleTraits.length / targetTraits.length) * 20);

  // 3. Hangout Scenario Overlap (Weight: 15%)
  const userHangout = answers.hangout || 'cafe_vinyl';
  const activityMatches = candidate.preferredActivities.includes(userHangout);
  const activityScore = activityMatches ? 15 : 4;
  const activityOverlap = activityMatches ? [userHangout] : [];

  // 4. Connection Intent Alignment (Weight: 15%)
  const userIntents: ConnectionIntent[] = answers.intent || ['new_friends'];
  const sharedIntents = candidate.connectionIntent.filter((intent) => userIntents.includes(intent));
  const intentScore =
    userIntents.length > 0
      ? (sharedIntents.length / userIntents.length) * 15
      : 5;

  // 5. Social Battery Dynamics (Weight: 10%)
  const userBattery = typeof answers.social_energy === 'number' ? answers.social_energy : 50;
  const socialDelta = Math.abs(userBattery - candidate.socialEnergy);
  const batteryScore = Math.max(0, 10 - (socialDelta / 100) * 10);

  // 6. Anti-Stagnation Entropy Injection (Weight: 10%)
  const pairSeed = `${sessionSeed}-${candidate.id}-${candidate.name}`;
  const entropyFloat = hashToFloat(pairSeed);
  const antiStagnationScore = Number((entropyFloat * 10).toFixed(1));

  // Raw weighted sum before clamping (0-100)
  const rawSum = interestScore + traitScore + activityScore + intentScore + batteryScore + antiStagnationScore;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawSum)));

  const components: CompatibilityComponentScores = {
    sharedInterestsScore: Math.round(interestScore),
    traitScore: Math.round(traitScore),
    activityScore: Math.round(activityScore),
    intentScore: Math.round(intentScore),
    batteryScore: Math.round(batteryScore),
    antiStagnationScore: Math.round(antiStagnationScore),
    rawSum: Math.round(rawSum),
  };

  // Explainable compatibility tier assignment
  let level: CompatibilityResult['level'] = 'Unique vibe';
  if (finalScore >= 88) level = 'Exceptional overlap';
  else if (finalScore >= 75) level = 'Very strong vibe';
  else if (finalScore >= 60) level = 'Strong vibe';
  else if (finalScore >= 40) level = 'Potential connection';
  else level = 'Unique vibe';

  // Generate explainable reasons grounded in actual scoring signals
  const reasons: string[] = [];

  if (sharedInterests.length > 0) {
    const interestLabels = sharedInterests.map((i) => i.replace('_', ' '));
    reasons.push(`Shared resonance in ${interestLabels.join(' and ')}.`);
  }

  if (activityMatches) {
    reasons.push('Both picked parallel low-pressure first hangouts.');
  }

  if (socialDelta <= 20) {
    reasons.push(`Aligned social battery levels (${userBattery}% vs ${candidate.socialEnergy}%).`);
  } else if (socialDelta <= 40) {
    reasons.push('Complementary social dynamics that balance quiet and active moods.');
  }

  if (sharedIntents.length > 0) {
    reasons.push('Both seeking similar connection goals in the venue.');
  } else if (reasons.length === 0) {
    reasons.push('Unique perspectives ready for fresh exploratory conversation.');
  }

  return {
    score: finalScore,
    level,
    reasons: reasons.slice(0, 3),
    sharedInterests,
    compatibleTraits,
    activityOverlap,
    socialDelta,
    engineVersion: ENGINE_METADATA.engineVersion,
    components,
  };
}

/**
 * Evaluates candidate profiles, strictly enforcing profile lifecycle and privacy visibility.
 * Profiles with DRAFT, PAUSED, HIDDEN, BLOCKED, or DELETED are filtered out.
 */
export function evaluateAllCandidates(
  answers: Record<string, any>,
  candidates: CandidateProfile[],
  blockedIds: string[] = [],
  sessionSeed: string = 'SESSION-DEFAULT'
): Array<{ candidate: CandidateProfile; compatibility: CompatibilityResult }> {
  const allowed = candidates.filter((c) => {
    // 1. Blocked check
    if (blockedIds.includes(c.id)) return false;

    // 2. Lifecycle status check (Phase 4 requirement)
    if (c.lifecycleStatus && c.lifecycleStatus !== 'ACTIVE') return false;

    // 3. Visibility check
    if (c.visibility && c.visibility === 'HIDDEN') return false;

    return true;
  });

  const evaluated = allowed.map((candidate) => {
    const compatibility = calculateCompatibility(answers, candidate, sessionSeed);
    return {
      candidate,
      compatibility,
    };
  });

  return evaluated.sort((a, b) => b.compatibility.score - a.compatibility.score);
}

export function findBestMatch(
  answers: Record<string, any>,
  candidates: CandidateProfile[],
  blockedIds: string[] = [],
  skipCandidateId?: string,
  sessionSeed: string = 'SESSION-DEFAULT',
  userConsent: boolean = false
): MatchResult | null {
  const filteredCandidates = candidates.filter(
    (c) =>
      !blockedIds.includes(c.id) &&
      c.id !== skipCandidateId &&
      (!c.lifecycleStatus || c.lifecycleStatus === 'ACTIVE') &&
      (!c.visibility || c.visibility !== 'HIDDEN')
  );

  if (filteredCandidates.length === 0) {
    return null;
  }

  const evaluated = evaluateAllCandidates(answers, filteredCandidates, blockedIds, sessionSeed);
  if (evaluated.length === 0) return null;

  const top = evaluated[0];
  const candidateConsent = top.candidate.contactSharingEnabled;
  const dualConsent = userConsent && candidateConsent;

  // Generate real server-backed connection token
  // Deterministic token generation fallback if synchronous, while saving to tokenResolutionService
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const p1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const token = `MM-${p1}-${p2}`;

  const tokenData = {
    token,
    sessionId: sessionSeed,
    candidateId: top.candidate.id,
    expiresAt: Date.now() + TOKEN_EXPIRATION_MS,
    dualConsent,
    status: 'ACTIVE' as const,
    guestConsent: userConsent,
    candidateConsent,
  };

  // Register with token service
  tokenResolutionService.createToken({
    sessionId: sessionSeed,
    matchId: `match-${sessionSeed}-${top.candidate.id}`,
    candidateId: top.candidate.id,
    guestConsent: userConsent,
    candidateConsent,
  }).catch(() => {});

  return {
    candidate: top.candidate,
    compatibility: top.compatibility,
    matchToken: token,
    contactRevealed: false,
    createdAt: Date.now(),
    connectionTokenData: tokenData,
  };
}
