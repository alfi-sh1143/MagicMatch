import { TemporaryConnectionToken } from '../../types';

export const TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generates an anonymous, high-entropy connection token formatted for kiosk readability.
 * E.g. "MM-X8K4-2F91"
 * Never encodes phone numbers, emails, or personal handles in the token string itself.
 */
export function generateConnectionToken(sessionId: string, candidateId: string, dualConsent: boolean): TemporaryConnectionToken {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing 0/O, 1/I
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const token = `MM-${part1}-${part2}`;

  const tokenData: TemporaryConnectionToken = {
    token,
    sessionId,
    candidateId,
    expiresAt: Date.now() + TOKEN_EXPIRATION_MS,
    dualConsent,
  };

  saveConnectionToken(tokenData);
  return tokenData;
}

const TOKENS_STORAGE_KEY = 'magicmatch_connection_tokens';

export function saveConnectionToken(tokenData: TemporaryConnectionToken): void {
  if (typeof window === 'undefined') return;
  try {
    const list: TemporaryConnectionToken[] = JSON.parse(localStorage.getItem(TOKENS_STORAGE_KEY) || '[]');
    // Clean expired
    const active = list.filter((t) => t.expiresAt > Date.now());
    active.push(tokenData);
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(active.slice(-50)));
  } catch {}
}

export function verifyConnectionToken(token: string): { valid: boolean; expired: boolean; data?: TemporaryConnectionToken } {
  if (typeof window === 'undefined') return { valid: false, expired: false };
  try {
    const list: TemporaryConnectionToken[] = JSON.parse(localStorage.getItem(TOKENS_STORAGE_KEY) || '[]');
    const match = list.find((t) => t.token.toUpperCase() === token.trim().toUpperCase());
    if (!match) return { valid: false, expired: false };
    if (match.expiresAt <= Date.now()) {
      return { valid: false, expired: true, data: match };
    }
    return { valid: true, expired: false, data: match };
  } catch {
    return { valid: false, expired: false };
  }
}
