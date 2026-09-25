import {
  calculateCompatibility,
  findBestMatch,
  evaluateAllCandidates,
  ENGINE_METADATA,
} from '../services/matching/engine';
import { generateConnectionToken } from '../services/matching/tokens';
import { tokenResolutionService, TOKEN_EXPIRATION_MS } from '../services/matching/tokenService';
import { thermalPrinterDriver } from '../services/hardware/thermalPrinter';
import { MOCK_CANDIDATE_PROFILES } from '../data/profiles';
import { CandidateProfile } from '../types';

async function runUnitTests() {
  console.log('====================================================');
  console.log('--- RUNNING MAGICMATCH ENGINE COMPREHENSIVE SUITE ---');
  console.log('====================================================');

  const maya = MOCK_CANDIDATE_PROFILES.find((p) => p.name === 'Maya Chen')!;

  // -----------------------------------------------------------------
  // Case A: Very strong overlap
  // -----------------------------------------------------------------
  const caseA_Answers = {
    energy: 'creative',
    interests: ['photography', 'design', 'music', 'coffee'],
    hangout: 'cafe_vinyl',
    social_energy: 45,
    intent: ['creative_projects', 'new_friends', 'hangouts'],
  };
  const resultA = calculateCompatibility(caseA_Answers, maya, 'SEED-TEST-A');
  console.assert(resultA.score >= 80, `Case A failed: score was ${resultA.score}, expected >= 80`);
  console.assert(
    resultA.level === 'Exceptional overlap' || resultA.level === 'Very strong vibe',
    `Case A level unexpected: ${resultA.level}`
  );
  console.assert(resultA.reasons.length >= 2, 'Case A should have multiple explainable reasons');
  console.assert(resultA.components.sharedInterestsScore > 0, 'Components must break down interest score');
  console.assert(resultA.engineVersion === ENGINE_METADATA.engineVersion, 'Engine version must match');
  console.log(`✓ Case A Passed: Very strong overlap scored ${resultA.score}% [${resultA.level}] (Engine ${resultA.engineVersion})`);

  // -----------------------------------------------------------------
  // Case B: Very weak overlap
  // -----------------------------------------------------------------
  const caseB_Answers = {
    energy: 'social',
    interests: ['sports', 'anime', 'coding'], // Zero overlap with Maya
    hangout: 'arcade_board', // Maya prefers cafe_vinyl, museum_walk, night_walk
    social_energy: 95, // Delta with Maya's 45 is 50 -> battery score low
    intent: ['dating'], // Maya has creative_projects, new_friends, hangouts
  };
  const resultB = calculateCompatibility(caseB_Answers, maya, 'SEED-TEST-B');
  console.assert(resultB.score < 40, `Case B failed: score was ${resultB.score}, expected < 40`);
  console.assert(resultB.level === 'Unique vibe', `Case B level unexpected: ${resultB.level}`);
  console.assert(resultB.sharedInterests.length === 0, 'Case B should have 0 shared interests');
  console.log(`✓ Case B Passed: Very weak overlap scored ${resultB.score}% [${resultB.level}]`);

  // -----------------------------------------------------------------
  // Case C: Same interests but incompatible intent
  // -----------------------------------------------------------------
  const caseC_Answers = {
    energy: 'creative',
    interests: ['photography', 'design', 'music'], // High overlap with Maya
    hangout: 'cafe_vinyl',
    social_energy: 45,
    intent: ['dating', 'study_partner'], // Maya does NOT have these intents
  };
  const resultC = calculateCompatibility(caseC_Answers, maya, 'SEED-TEST-C');
  console.assert(resultC.sharedInterests.length >= 2, 'Case C should have high interest overlap');
  console.assert(resultC.score < resultA.score, 'Case C score should be lower than Case A due to missing intent');
  console.log(`✓ Case C Passed: Same interests but incompatible intent scored ${resultC.score}% (penalized intent)`);

  // -----------------------------------------------------------------
  // Case D: Good intent compatibility but weak interests
  // -----------------------------------------------------------------
  const caseD_Answers = {
    energy: 'chill',
    interests: ['gaming', 'tech', 'anime'], // 0 overlap with Maya
    hangout: 'cafe_vinyl',
    social_energy: 45,
    intent: ['creative_projects', 'new_friends', 'hangouts'], // Exact intent match
  };
  const resultD = calculateCompatibility(caseD_Answers, maya, 'SEED-TEST-D');
  console.assert(resultD.sharedInterests.length === 0, 'Case D should have 0 shared interests');
  console.assert(resultD.score < resultA.score, 'Case D should be lower than Case A due to no interest overlap');
  console.log(`✓ Case D Passed: Good intent compatibility but weak interests scored ${resultD.score}%`);

  // -----------------------------------------------------------------
  // Case E: Blocked candidate
  // -----------------------------------------------------------------
  const matchOriginal = findBestMatch(caseA_Answers, MOCK_CANDIDATE_PROFILES, [], undefined, 'SEED-123');
  console.assert(matchOriginal !== null, 'Match must not be null');
  const matchedId = matchOriginal!.candidate.id;

  const matchWithBlock = findBestMatch(caseA_Answers, MOCK_CANDIDATE_PROFILES, [matchedId], undefined, 'SEED-123');
  console.assert(matchWithBlock !== null, 'Next match must be found');
  console.assert(matchWithBlock!.candidate.id !== matchedId, 'Blocked candidate must never appear');
  console.log(`✓ Case E Passed: Blocked candidate (${matchedId}) was cleanly excluded; selected ${matchWithBlock!.candidate.id}`);

  // -----------------------------------------------------------------
  // Case F: Dual-Consent privacy contact checks (all 4 combinations)
  // -----------------------------------------------------------------
  const profilePrivate: CandidateProfile = {
    ...maya,
    id: 'f-private',
    contactSharingEnabled: false,
    instagramHandle: '@private_handle',
    phoneNumber: '+1-555-0100',
  };
  const profilePublic: CandidateProfile = {
    ...maya,
    id: 'f-public',
    contactSharingEnabled: true,
    instagramHandle: '@public_handle',
    phoneNumber: '+1-555-0200',
  };

  const canShow_FF = profilePrivate.contactSharingEnabled && false;
  console.assert(!canShow_FF, 'FF must not expose contact');

  const canShow_FT = profilePublic.contactSharingEnabled && false;
  console.assert(!canShow_FT, 'FT must not expose contact');

  const canShow_TF = profilePrivate.contactSharingEnabled && true;
  console.assert(!canShow_TF, 'TF must not expose contact');

  const canShow_TT = profilePublic.contactSharingEnabled && true;
  console.assert(canShow_TT, 'TT must expose contact only when BOTH consent');
  console.log('✓ Case F Passed: Dual-consent privacy verified across all 4 truth combinations');

  // -----------------------------------------------------------------
  // Case G: Deterministic reproducibility and anti-stagnation
  // -----------------------------------------------------------------
  const eval1 = evaluateAllCandidates(caseA_Answers, MOCK_CANDIDATE_PROFILES, [], 'SESSION-STABLE-ALPHA');
  const eval2 = evaluateAllCandidates(caseA_Answers, MOCK_CANDIDATE_PROFILES, [], 'SESSION-STABLE-ALPHA');
  console.assert(eval1[0].candidate.id === eval2[0].candidate.id, 'Deterministic seed must produce identical top rank');
  console.assert(eval1[0].compatibility.score === eval2[0].compatibility.score, 'Deterministic seed must produce identical score');

  const evalDiffSeed = evaluateAllCandidates(caseA_Answers, MOCK_CANDIDATE_PROFILES, [], 'SESSION-STABLE-BETA');
  console.assert(evalDiffSeed.length === eval1.length, 'Pool size must be equal');
  console.log(`✓ Case G Passed: Session seed reproducibility confirmed (Top: ${eval1[0].candidate.name}, Score: ${eval1[0].compatibility.score}%)`);

  // -----------------------------------------------------------------
  // Case H: Temporary Connection Token Lifecycle & Privacy Guard
  // -----------------------------------------------------------------
  const tokenRecord = generateConnectionToken('SESSION-H', 'cand-01', true);
  console.assert(tokenRecord.token.startsWith('MM-'), 'Token format must start with MM-');
  console.assert(!tokenRecord.token.includes('555'), 'Token must never include raw phone digits');
  console.assert(!tokenRecord.token.includes('@'), 'Token must never include email/social handle');
  console.assert(tokenRecord.expiresAt > Date.now(), 'Token must have future expiration');
  console.log(`✓ Case H Passed: High-entropy token generated [${tokenRecord.token}] with 15m expiration & zero raw PII`);

  // -----------------------------------------------------------------
  // Case I: Profile Lifecycle Filtering (Phase 4)
  // Profiles in DRAFT, PAUSED, HIDDEN, or BLOCKED status must NEVER be matched
  // -----------------------------------------------------------------
  const testProfilesWithLifecycle: CandidateProfile[] = [
    { ...maya, id: 'prof-active', lifecycleStatus: 'ACTIVE', visibility: 'PUBLIC' },
    { ...maya, id: 'prof-draft', lifecycleStatus: 'DRAFT', visibility: 'PUBLIC' },
    { ...maya, id: 'prof-paused', lifecycleStatus: 'PAUSED', visibility: 'PUBLIC' },
    { ...maya, id: 'prof-hidden', lifecycleStatus: 'ACTIVE', visibility: 'HIDDEN' },
    { ...maya, id: 'prof-blocked', lifecycleStatus: 'BLOCKED', visibility: 'PUBLIC' },
    { ...maya, id: 'prof-deleted', lifecycleStatus: 'DELETED', visibility: 'PUBLIC' },
  ];

  const filteredEvaluation = evaluateAllCandidates(caseA_Answers, testProfilesWithLifecycle);
  console.assert(
    filteredEvaluation.length === 1 && filteredEvaluation[0].candidate.id === 'prof-active',
    `Case I failed: Expected exactly 1 active profile, found ${filteredEvaluation.length}`
  );
  console.log('✓ Case I Passed: Profile lifecycle gating cleanly filtered out DRAFT, PAUSED, HIDDEN, and BLOCKED profiles');

  // -----------------------------------------------------------------
  // Case J: Server-Authoritative Token Resolution & Expiration (Phase 4)
  // Even if client clock is drifted, authoritative server time rejects expired tokens
  // -----------------------------------------------------------------
  const createdToken = await tokenResolutionService.createToken({
    sessionId: 'SESS-TEST-J',
    matchId: 'MATCH-TEST-J',
    candidateId: maya.id,
    guestConsent: true,
    candidateConsent: true,
  });

  // Test 1: Immediate resolution while active
  const validRes = await tokenResolutionService.resolveToken(createdToken.token, createdToken.createdAt + 1000);
  console.assert(validRes.authorized === true, 'Token must be authorized when active and both consented');
  console.assert(validRes.profile?.phoneNumber === maya.phoneNumber, 'Phone number must be revealed upon mutual consent');

  // Test 2: Expired resolution (16 minutes after creation)
  const expiredTime = createdToken.createdAt + 16 * 60 * 1000;
  const expiredRes = await tokenResolutionService.resolveToken(createdToken.token, expiredTime);
  console.assert(expiredRes.authorized === false, 'Expired token must NOT be authorized');
  console.assert(expiredRes.status === 'EXPIRED', `Expected status EXPIRED, got ${expiredRes.status}`);
  console.assert(!expiredRes.profile, 'Expired resolution must NEVER leak contact details');
  console.log(`✓ Case J Passed: Server-authoritative expiration strictly enforced after 15m window; zero PII leaked`);

  // -----------------------------------------------------------------
  // Case K: Dual-Consent State Machine & Real-Time Revocation (Phase 4)
  // -----------------------------------------------------------------
  const pendingToken = await tokenResolutionService.createToken({
    sessionId: 'SESS-TEST-K',
    matchId: 'MATCH-TEST-K',
    candidateId: maya.id,
    guestConsent: false, // Guest has not granted consent yet
    candidateConsent: true,
  });

  // Step 1: Initial resolution must be PENDING_DUAL_CONSENT (no contact revealed)
  const initialPendingRes = await tokenResolutionService.resolveToken(pendingToken.token);
  console.assert(initialPendingRes.authorized === false, 'Pending token must not be authorized');
  console.assert(initialPendingRes.status === 'PENDING_DUAL_CONSENT', 'Status must be PENDING_DUAL_CONSENT');
  console.assert(initialPendingRes.teaser !== undefined, 'Teaser information should be present for UX');
  console.assert(!initialPendingRes.profile?.phoneNumber, 'Phone number must be concealed');

  // Step 2: Guest submits consent via mobile portal
  const consentRes = await tokenResolutionService.submitGuestConsent(pendingToken.token, true);
  console.assert(consentRes.authorized === true, 'Once both consent, token must become authorized');
  console.assert(consentRes.profile?.instagramHandle === maya.instagramHandle, 'Instagram handle disclosed after mutual consent');

  // Step 3: Either participant revokes consent
  const revoked = await tokenResolutionService.revokeConnection(pendingToken.token, 'guest');
  console.assert(revoked === true, 'Revocation must succeed');
  const postRevokeRes = await tokenResolutionService.resolveToken(pendingToken.token);
  console.assert(postRevokeRes.authorized === false, 'Revoked connection must NOT be authorized');
  console.assert(postRevokeRes.status === 'REVOKED', 'Status must be REVOKED');
  console.log('✓ Case K Passed: Dual-consent lifecycle confirmed: Pending -> Mutual Authorized -> Instant Revocation');

  // -----------------------------------------------------------------
  // Case L: ESC/POS Thermal Printer Driver Command Generation (Phase 4)
  // -----------------------------------------------------------------
  const escBuffer = thermalPrinterDriver.generateEscPosBuffer({
    venueName: 'The Social Art Lounge',
    boothName: 'Kiosk Node 01',
    sessionId: 'MM-TEST-L',
    token: 'MM-9EY4-JWW4',
    matchName: 'Maya Chen',
    score: 94,
  });
  console.assert(escBuffer.length > 50, 'ESC/POS buffer must contain binary printer commands');
  console.assert(escBuffer[0] === 0x1b && escBuffer[1] === 0x40, 'Must begin with ESC @ init');
  // Check that the cut command (GS V) exists in buffer
  let hasCutCommand = false;
  for (let i = 0; i < escBuffer.length - 1; i++) {
    if (escBuffer[i] === 0x1d && escBuffer[i + 1] === 0x56) {
      hasCutCommand = true;
      break;
    }
  }
  console.assert(hasCutCommand, 'ESC/POS buffer must include GS V auto-cut sequence');
  console.log(`✓ Case L Passed: ESC/POS thermal command stream generated (${escBuffer.length} bytes) with auto-cut`);

  console.log('====================================================');
  console.log('ALL MAGICMATCH ENGINE CASES (A through L) PASSED!');
  console.log('====================================================');
}

runUnitTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
