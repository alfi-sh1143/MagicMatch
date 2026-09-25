export type ConnectionIntent =
  | 'new_friends'
  | 'hangouts'
  | 'creative_projects'
  | 'dating'
  | 'study_partner'
  | 'networking';

export type ProfileLifecycle = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'HIDDEN' | 'BLOCKED' | 'DELETED';
export type ProfileVisibility = 'PUBLIC' | 'VENUE_ONLY' | 'HIDDEN';
export type ContactSharingPolicy = 'opt_in' | 'mutual_only' | 'disabled';

export interface CandidateProfile {
  id: string;
  name: string;
  displayName: string;
  ageRange: string;
  city: string;
  avatarSeed: string; // Used for consistent SVG avatar styling
  profileImage?: string;
  bio: string;
  interests: string[];
  traits: string[];
  preferredActivities: string[];
  socialEnergy: number; // 0 to 100
  connectionIntent: ConnectionIntent[];
  contactSharingEnabled: boolean;
  instagramHandle?: string;
  phoneNumber?: string;
  email?: string;
  // Phase 4 Lifecycle & Privacy Controls
  lifecycleStatus?: ProfileLifecycle; // default 'ACTIVE'
  visibility?: ProfileVisibility;     // default 'PUBLIC'
  contactSharingPolicy?: ContactSharingPolicy; // default 'mutual_only'
  venueRadiusKm?: number;             // default 30
  photoVisibility?: 'PUBLIC' | 'MUTUAL_MATCH_ONLY' | 'HIDDEN';
}

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  iconName?: string;
  tag?: string;
}

export interface Question {
  id: string;
  title: string;
  subtitle: string;
  type: 'cards' | 'tags' | 'slider' | 'single' | 'multiselect' | 'consent';
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  maxSelections?: number;
  helperText?: string;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  filterName?: 'normal' | 'mono' | 'warm' | 'cyber';
}

export interface CompatibilityComponentScores {
  sharedInterestsScore: number; // Max 30
  traitScore: number;           // Max 20
  activityScore: number;        // Max 15
  intentScore: number;          // Max 15
  batteryScore: number;         // Max 10
  antiStagnationScore: number;  // Max 10
  rawSum: number;
}

export interface CompatibilityResult {
  score: number; // 0 - 100
  level: 'Exceptional overlap' | 'Very strong vibe' | 'Strong vibe' | 'Potential connection' | 'Unique vibe';
  reasons: string[];
  sharedInterests: string[];
  compatibleTraits: string[];
  activityOverlap: string[];
  socialDelta: number;
  engineVersion: string;
  components: CompatibilityComponentScores;
}

export type ConnectionTokenStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

export interface TemporaryConnectionToken {
  token: string;
  tokenHash?: string;
  sessionId: string;
  candidateId: string;
  expiresAt: number; // Unix timestamp ms
  dualConsent: boolean;
  status?: ConnectionTokenStatus;
  guestConsent?: boolean;
  candidateConsent?: boolean;
}

export interface StoredConnectionToken {
  id: string;
  token: string;
  tokenHash: string;
  matchId: string;
  sessionId: string;
  candidateId: string;
  createdAt: number;
  expiresAt: number;
  accessedAt?: number;
  accessCount?: number;
  status: ConnectionTokenStatus;
  guestConsent: boolean;
  candidateConsent: boolean;
  guestConsentAt?: number;
  candidateConsentAt?: number;
  revokedAt?: number;
  revokedBy?: 'guest' | 'candidate' | 'operator' | 'timeout';
}

export interface ConnectionVerificationResult {
  authorized: boolean;
  status: ConnectionTokenStatus | 'INVALID_TOKEN' | 'PENDING_DUAL_CONSENT' | 'PROFILE_UNAVAILABLE';
  message: string;
  expiresAt?: number;
  profile?: {
    id: string;
    displayName: string;
    city: string;
    bio: string;
    avatarSeed: string;
    instagramHandle?: string;
    phoneNumber?: string;
    email?: string;
    interests?: string[];
  };
  teaser?: {
    displayName: string;
    city: string;
    avatarSeed: string;
    interests?: string[];
    vibeScore?: number;
  };
  consents?: {
    guestConsent: boolean;
    candidateConsent: boolean;
    guestConsentAt?: number;
    candidateConsentAt?: number;
    mutualConsentAchieved: boolean;
  };
}

export interface MatchResult {
  candidate: CandidateProfile;
  compatibility: CompatibilityResult;
  matchToken: string;
  contactRevealed: boolean;
  createdAt: number;
  connectionTokenData?: TemporaryConnectionToken;
}

export type BoothStep =
  | 'attract'
  | 'welcome'
  | 'how_it_works'
  | 'questions'
  | 'camera'
  | 'matching'
  | 'reveal'
  | 'no_match'
  | 'strip'
  | 'completed';

export interface BoothSession {
  id: string;
  startedAt: number;
  completedAt?: number;
  step: BoothStep;
  answers: Record<string, any>;
  photos: CapturedPhoto[];
  match: MatchResult | null;
  candidatesEvaluated: number;
  contactConsent: boolean;
  printRequested: boolean;
  isSimulation?: boolean;
}

export type PrintJobStatus = 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface PrintJob {
  id: string;
  sessionId: string;
  createdAt: number;
  status: PrintJobStatus;
  attempts: number;
  errorMessage?: string;
  payload: {
    photoCount: number;
    hasMatch: boolean;
    matchName?: string;
    token?: string;
  };
}

export type HardwareStatusLevel = 'online' | 'degraded' | 'offline';

export interface SubsystemHealth {
  status: HardwareStatusLevel;
  lastCheck: string;
  latencyMs?: number;
  lastError?: string;
}

export interface BoothHealthTelemetry {
  camera: SubsystemHealth;
  printer: SubsystemHealth;
  storage: SubsystemHealth;
  matchEngine: SubsystemHealth;
  network: SubsystemHealth;
  backend: SubsystemHealth;
  audio: SubsystemHealth;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  event: string;
  level: 'info' | 'warn' | 'success' | 'action';
}

export interface BoothEvent {
  id: string;
  boothId: string;
  sessionId?: string;
  eventType: string;
  payload?: Record<string, any>;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  createdAt: number;
}

export interface VenueConfig {
  venueId: string;
  venueName: string;
  boothId: string;
  boothName: string;
  city: string;
  timezone: string;
  brandAccent: string; // e.g. '#fb7185' for rose-400
  welcomeMessage: string;
  sessionTimeoutSec: number; // default 120
  inactivityWarningSec: number; // default 20
  photoCount: number; // default 3
  printEnabled: boolean;
  soundEnabled: boolean;
  demoCameraAllowed: boolean;
  contactSharingEnabled: boolean;
  qrEnabled: boolean;
  photoRetentionHours: number; // 0 = delete immediately on session end
  researchModeEnabled: boolean;
  operatorPin: string; // default '1234'
}
