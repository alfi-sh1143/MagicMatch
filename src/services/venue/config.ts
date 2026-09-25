import { VenueConfig } from '../../types';

export const DEFAULT_VENUE_CONFIG: VenueConfig = {
  venueId: 'vn-art-lounge-01',
  venueName: 'The Social Art Lounge & Cafe',
  boothId: 'booth-main-01',
  boothName: 'MagicMatch Kiosk 01',
  city: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  brandAccent: '#fb7185', // Rose 400
  welcomeMessage: 'Step in, snap three shots, and discover your vibe match across tonight’s venue.',
  sessionTimeoutSec: 120, // 2 minutes inactivity
  inactivityWarningSec: 20, // 20s countdown
  photoCount: 3,
  printEnabled: true,
  soundEnabled: true,
  demoCameraAllowed: true,
  contactSharingEnabled: true,
  qrEnabled: true,
  photoRetentionHours: 0, // 0 = delete immediately when session ends
  researchModeEnabled: false,
  operatorPin: '1234', // DEVELOPMENT / DEMO ONLY PIN. Production requires remote server-backed authentication.
};

const VENUE_CONFIG_KEY = 'magicmatch_venue_config';

export function getVenueConfig(): VenueConfig {
  if (typeof window === 'undefined') return DEFAULT_VENUE_CONFIG;
  try {
    const raw = localStorage.getItem(VENUE_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_VENUE_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Could not read venue config:', e);
  }
  return DEFAULT_VENUE_CONFIG;
}

export function saveVenueConfig(config: VenueConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VENUE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save venue config:', e);
  }
}
