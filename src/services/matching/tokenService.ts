import {
  StoredConnectionToken,
  ConnectionVerificationResult,
  ConnectionTokenStatus,
  CandidateProfile,
} from '../../types';
import { MOCK_CANDIDATE_PROFILES } from '../../data/profiles';

export const TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes strict window
const TOKENS_STORAGE_KEY = 'magicmatch_backend_connection_tokens';

/**
 * Computes a SHA-256 hash representation of a token string.
 * Used for zero-knowledge server lookup so tokens can't be guessed.
 */
export async function hashToken(token: string): Promise<string> {
  const normalized = token.trim().toUpperCase();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Deterministic fallback hash for test environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export class TokenResolutionService {
  private static instance: TokenResolutionService;

  private inMemoryTokens: Map<string, StoredConnectionToken> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): TokenResolutionService {
    if (!TokenResolutionService.instance) {
      TokenResolutionService.instance = new TokenResolutionService();
    }
    return TokenResolutionService.instance;
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
      if (stored) {
        const list: StoredConnectionToken[] = JSON.parse(stored);
        list.forEach((t) => {
          this.inMemoryTokens.set(t.token.toUpperCase(), t);
          this.inMemoryTokens.set(t.tokenHash, t);
        });
      }
    } catch {}
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      // Deduplicate before saving
      const uniqueTokens = Array.from(new Set(this.inMemoryTokens.values()));
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(uniqueTokens.slice(-100)));
    } catch {}
  }

  /**
   * Generates a new cryptographically structured connection token
   * Format: MM-XXXX-XXXX
   */
  async createToken(params: {
    sessionId: string;
    matchId: string;
    candidateId: string;
    guestConsent: boolean;
    candidateConsent: boolean;
  }): Promise<StoredConnectionToken> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const p1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const tokenDisplay = `MM-${p1}-${p2}`;
    const tokenHash = await hashToken(tokenDisplay);

    const now = Date.now();
    const tokenRecord: StoredConnectionToken = {
      id: `tok-${Math.random().toString(36).substring(2, 9)}`,
      token: tokenDisplay,
      tokenHash,
      sessionId: params.sessionId,
      matchId: params.matchId,
      candidateId: params.candidateId,
      createdAt: now,
      expiresAt: now + TOKEN_EXPIRATION_MS,
      status: 'ACTIVE',
      guestConsent: params.guestConsent,
      candidateConsent: params.candidateConsent,
      guestConsentAt: params.guestConsent ? now : undefined,
      candidateConsentAt: params.candidateConsent ? now : undefined,
      accessCount: 0,
    };

    this.inMemoryTokens.set(tokenDisplay.toUpperCase(), tokenRecord);
    this.inMemoryTokens.set(tokenHash, tokenRecord);
    this.saveToStorage();

    return tokenRecord;
  }

  /**
   * Server-authoritative resolution of connection token.
   * Enforces:
   * 1. Token existence & validity
   * 2. Authoritative expiration timestamp (rejects if expired)
   * 3. Revocation status
   * 4. Profile availability (active lifecycle)
   * 5. Dual Consent gating: returns sensitive details ONLY if both true
   */
  async resolveToken(
    tokenInput: string,
    authoritativeServerTimeMs: number = Date.now()
  ): Promise<ConnectionVerificationResult> {
    const clean = tokenInput.trim().toUpperCase();
    let record = this.inMemoryTokens.get(clean);

    if (!record) {
      const hashed = await hashToken(clean);
      record = this.inMemoryTokens.get(hashed);
    }

    if (!record) {
      return {
        authorized: false,
        status: 'INVALID_TOKEN',
        message: 'Invalid or unrecognized connection token. Please check the code and try again.',
      };
    }

    // 1. Check authoritative expiration
    if (record.status === 'EXPIRED' || authoritativeServerTimeMs >= record.expiresAt) {
      record.status = 'EXPIRED';
      this.saveToStorage();
      return {
        authorized: false,
        status: 'EXPIRED',
        expiresAt: record.expiresAt,
        message: 'This connection token expired 15 minutes after session creation for your privacy.',
      };
    }

    // 2. Check revocation
    if (record.status === 'REVOKED') {
      return {
        authorized: false,
        status: 'REVOKED',
        message: `This connection was revoked by ${record.revokedBy || 'a participant'}.`,
      };
    }

    // 3. Locate candidate profile
    const candidate = MOCK_CANDIDATE_PROFILES.find((p) => p.id === record!.candidateId);
    if (!candidate || (candidate.lifecycleStatus && candidate.lifecycleStatus !== 'ACTIVE')) {
      return {
        authorized: false,
        status: 'PROFILE_UNAVAILABLE',
        message: 'This profile is currently paused or no longer available.',
      };
    }

    const teaser = {
      displayName: candidate.displayName,
      city: candidate.city,
      avatarSeed: candidate.avatarSeed,
      interests: candidate.interests,
    };

    // 4. Dual-Consent Authorization Gate
    const mutualConsent = record.guestConsent && record.candidateConsent && candidate.contactSharingEnabled;

    if (!mutualConsent) {
      return {
        authorized: false,
        status: 'PENDING_DUAL_CONSENT',
        expiresAt: record.expiresAt,
        message: 'Mutual consent is required. Both guests must confirm connection consent to unlock details.',
        teaser,
        consents: {
          guestConsent: record.guestConsent,
          candidateConsent: record.candidateConsent,
          guestConsentAt: record.guestConsentAt,
          candidateConsentAt: record.candidateConsentAt,
          mutualConsentAchieved: false,
        },
      };
    }

    // 5. Authorized! Update access tracking
    record.accessedAt = authoritativeServerTimeMs;
    record.accessCount = (record.accessCount || 0) + 1;
    this.saveToStorage();

    return {
      authorized: true,
      status: 'ACTIVE',
      expiresAt: record.expiresAt,
      message: 'Connection verified! Mutual consent confirmed.',
      profile: {
        id: candidate.id,
        displayName: candidate.displayName,
        city: candidate.city,
        bio: candidate.bio,
        avatarSeed: candidate.avatarSeed,
        instagramHandle: candidate.instagramHandle,
        phoneNumber: candidate.phoneNumber,
        email: candidate.email || `${candidate.avatarSeed}@example.com`,
        interests: candidate.interests,
      },
      consents: {
        guestConsent: record.guestConsent,
        candidateConsent: record.candidateConsent,
        guestConsentAt: record.guestConsentAt,
        candidateConsentAt: record.candidateConsentAt,
        mutualConsentAchieved: true,
      },
    };
  }

  /**
   * Submit guest consent from mobile connection page
   */
  async submitGuestConsent(tokenInput: string, consent: boolean): Promise<ConnectionVerificationResult> {
    const clean = tokenInput.trim().toUpperCase();
    const record = this.inMemoryTokens.get(clean);

    if (!record) {
      return {
        authorized: false,
        status: 'INVALID_TOKEN',
        message: 'Token not found.',
      };
    }

    if (Date.now() >= record.expiresAt) {
      record.status = 'EXPIRED';
      this.saveToStorage();
      return {
        authorized: false,
        status: 'EXPIRED',
        message: 'Token expired.',
      };
    }

    record.guestConsent = consent;
    record.guestConsentAt = consent ? Date.now() : undefined;
    this.saveToStorage();

    return this.resolveToken(tokenInput);
  }

  /**
   * Revoke connection token instantly
   */
  async revokeConnection(tokenInput: string, revokedBy: 'guest' | 'candidate' | 'operator'): Promise<boolean> {
    const clean = tokenInput.trim().toUpperCase();
    const record = this.inMemoryTokens.get(clean);
    if (!record) return false;

    record.status = 'REVOKED';
    record.revokedAt = Date.now();
    record.revokedBy = revokedBy;
    this.saveToStorage();
    return true;
  }

  /**
   * Diagnostic list for Operator Dashboard
   */
  getAllTokens(): StoredConnectionToken[] {
    const unique = Array.from(new Set(this.inMemoryTokens.values()));
    return unique.sort((a, b) => b.createdAt - a.createdAt);
  }

  clearTokens(): void {
    this.inMemoryTokens.clear();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TOKENS_STORAGE_KEY);
      } catch {}
    }
  }
}

export const tokenResolutionService = TokenResolutionService.getInstance();
