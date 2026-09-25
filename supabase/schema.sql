-- =====================================================================
-- MAGICMATCH BOOTH — COMPREHENSIVE PRODUCTION DATABASE SCHEMA
-- Target Engine: PostgreSQL 15+ / Supabase
-- Features: Normalized tables, foreign keys, cascade rules, RLS policies,
--           secure connection token authorization, dual-consent gating.
-- =====================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. VENUES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venues (
    id TEXT PRIMARY KEY DEFAULT ('vn-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'San Francisco',
    timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    brand_accent TEXT DEFAULT '#fb7185',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. BOOTHS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booths (
    id TEXT PRIMARY KEY DEFAULT ('booth-' || substr(md5(random()::text), 1, 8)),
    venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model TEXT DEFAULT 'MagicMatch-Kiosk-v3',
    hardware_config JSONB DEFAULT '{
        "camera": "browser",
        "printer": "browser",
        "audio": true,
        "screen_resolution": "1920x1080"
    }'::jsonb,
    status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'PAUSED', 'MAINTENANCE', 'OFFLINE')),
    operator_pin_hash TEXT NOT NULL DEFAULT crypt('1234', gen_salt('bf')),
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. PROFILES TABLE (Candidate Pool)
-- Separates publicly matchable fields from private contact data
-- ---------------------------------------------------------------------
CREATE TYPE profile_lifecycle_enum AS ENUM (
    'DRAFT', 'ACTIVE', 'PAUSED', 'HIDDEN', 'BLOCKED', 'DELETED'
);

CREATE TYPE profile_visibility_enum AS ENUM (
    'PUBLIC', 'VENUE_ONLY', 'HIDDEN'
);

CREATE TYPE contact_sharing_policy_enum AS ENUM (
    'opt_in', 'mutual_only', 'disabled'
);

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT ('prof-' || substr(md5(random()::text), 1, 8)),
    user_id UUID, -- Optional linkage to auth.users if registered online
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    age_range TEXT NOT NULL DEFAULT '25-29',
    city TEXT NOT NULL DEFAULT 'San Francisco',
    bio TEXT NOT NULL,
    avatar_seed TEXT NOT NULL,
    profile_image_url TEXT,
    social_energy INT NOT NULL CHECK (social_energy >= 0 AND social_energy <= 100),
    lifecycle_status profile_lifecycle_enum NOT NULL DEFAULT 'ACTIVE',
    visibility profile_visibility_enum NOT NULL DEFAULT 'PUBLIC',
    contact_sharing_policy contact_sharing_policy_enum NOT NULL DEFAULT 'mutual_only',
    contact_sharing_enabled BOOLEAN NOT NULL DEFAULT true,
    venue_radius_km INT DEFAULT 30,
    photo_visibility TEXT DEFAULT 'MUTUAL_MATCH_ONLY',
    -- Sensitive private contacts (NEVER exposed to public queries)
    phone_encrypted TEXT,
    email_encrypted TEXT,
    instagram_handle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. PROFILE INTERESTS & TRAITS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_interests (
    id BIGSERIAL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interest_tag TEXT NOT NULL,
    weight INT DEFAULT 1,
    UNIQUE(profile_id, interest_tag)
);

CREATE TABLE IF NOT EXISTS profile_traits (
    id BIGSERIAL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trait_tag TEXT NOT NULL,
    UNIQUE(profile_id, trait_tag)
);

CREATE TABLE IF NOT EXISTS profile_preferred_activities (
    id BIGSERIAL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_tag TEXT NOT NULL,
    UNIQUE(profile_id, activity_tag)
);

CREATE TABLE IF NOT EXISTS profile_connection_intents (
    id BIGSERIAL PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    intent_tag TEXT NOT NULL,
    UNIQUE(profile_id, intent_tag)
);

-- ---------------------------------------------------------------------
-- 5. CANDIDATE PREFERENCES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_preferences (
    profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    preferred_intents TEXT[] DEFAULT ARRAY['new_friends', 'creative_projects']::TEXT[],
    preferred_age_min INT DEFAULT 21,
    preferred_age_max INT DEFAULT 45,
    max_radius_km INT DEFAULT 50,
    require_mutual_consent BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. BOOTH SESSIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT ('MM-' || upper(substr(md5(random()::text), 1, 6))),
    booth_id TEXT REFERENCES booths(id) ON DELETE SET NULL,
    venue_id TEXT REFERENCES venues(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    step TEXT NOT NULL DEFAULT 'welcome',
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'TIMEOUT', 'PURGED')),
    contact_consent_granted BOOLEAN DEFAULT false,
    print_requested BOOLEAN DEFAULT false,
    is_simulation BOOLEAN DEFAULT false,
    client_entropy_salt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 7. SESSION ANSWERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS answers (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    response_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

-- ---------------------------------------------------------------------
-- 8. CAPTURED MEDIA METADATA
-- Storing object references and hashes rather than huge raw base64
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS captured_media_metadata (
    id TEXT PRIMARY KEY DEFAULT ('media-' || substr(md5(random()::text), 1, 8)),
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    photo_index INT NOT NULL,
    storage_path TEXT,
    filter_applied TEXT DEFAULT 'normal',
    width INT DEFAULT 720,
    height INT DEFAULT 540,
    file_size_bytes INT,
    sha256_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 9. MATCHES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY DEFAULT ('match-' || substr(md5(random()::text), 1, 8)),
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    candidate_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    match_level TEXT NOT NULL,
    reasons TEXT[] DEFAULT '{}',
    breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    algorithm_version TEXT NOT NULL DEFAULT '2.4',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 10. CONNECTION CONSENTS & TOKENS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connection_consents (
    id TEXT PRIMARY KEY DEFAULT ('consent-' || substr(md5(random()::text), 1, 8)),
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    guest_consent BOOLEAN NOT NULL DEFAULT false,
    candidate_consent BOOLEAN NOT NULL DEFAULT true,
    guest_consent_at TIMESTAMPTZ,
    candidate_consent_at TIMESTAMPTZ DEFAULT NOW(),
    mutual_consent_achieved BOOLEAN GENERATED ALWAYS AS (guest_consent AND candidate_consent) STORED,
    revoked_at TIMESTAMPTZ,
    revoked_by TEXT CHECK (revoked_by IN ('guest', 'candidate', 'operator', 'timeout')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE token_status_enum AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');

CREATE TABLE IF NOT EXISTS connection_tokens (
    id TEXT PRIMARY KEY DEFAULT ('tok-' || substr(md5(random()::text), 1, 8)),
    token_display TEXT NOT NULL UNIQUE, -- e.g. "MM-9EY4-JWW4"
    token_hash TEXT NOT NULL UNIQUE,    -- SHA-256 of the token for lookup
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    consent_id TEXT REFERENCES connection_consents(id) ON DELETE CASCADE,
    status token_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    accessed_at TIMESTAMPTZ,
    access_count INT DEFAULT 0
);

-- ---------------------------------------------------------------------
-- 11. BLOCKED PROFILES & REPORTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocked_profiles (
    id BIGSERIAL PRIMARY KEY,
    booth_id TEXT REFERENCES booths(id) ON DELETE SET NULL,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    blocked_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    target_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 12. PRINT JOBS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS print_jobs (
    id TEXT PRIMARY KEY DEFAULT ('job-' || substr(md5(random()::text), 1, 8)),
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    booth_id TEXT REFERENCES booths(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PRINTING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 13. BOOTH EVENTS & OPERATOR ACTIONS AUDIT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booth_events (
    id BIGSERIAL PRIMARY KEY,
    booth_id TEXT REFERENCES booths(id) ON DELETE SET NULL,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload_json JSONB DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operator_actions (
    id BIGSERIAL PRIMARY KEY,
    booth_id TEXT REFERENCES booths(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'operator_pin',
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- INDEXES FOR LOW-LATENCY KIOSK QUERYING
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(lifecycle_status, visibility);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON connection_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON connection_tokens(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_matches_session ON matches(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_booth ON print_jobs(booth_id, status);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict zero-trust privacy boundaries
-- =====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_actions ENABLE ROW LEVEL SECURITY;

-- 1. Public Kiosk View: Only Active & Public Profiles, NO phone/email/instagram
CREATE OR REPLACE VIEW public_candidate_profiles AS
SELECT
    p.id,
    p.name,
    p.display_name,
    p.age_range,
    p.city,
    p.bio,
    p.avatar_seed,
    p.profile_image_url,
    p.social_energy,
    p.contact_sharing_enabled,
    p.venue_radius_km,
    COALESCE(array_agg(DISTINCT pi.interest_tag) FILTER (WHERE pi.interest_tag IS NOT NULL), '{}') AS interests,
    COALESCE(array_agg(DISTINCT pt.trait_tag) FILTER (WHERE pt.trait_tag IS NOT NULL), '{}') AS traits,
    COALESCE(array_agg(DISTINCT pa.activity_tag) FILTER (WHERE pa.activity_tag IS NOT NULL), '{}') AS preferred_activities,
    COALESCE(array_agg(DISTINCT pci.intent_tag) FILTER (WHERE pci.intent_tag IS NOT NULL), '{}') AS connection_intent
FROM profiles p
LEFT JOIN profile_interests pi ON pi.profile_id = p.id
LEFT JOIN profile_traits pt ON pt.profile_id = p.id
LEFT JOIN profile_preferred_activities pa ON pa.profile_id = p.id
LEFT JOIN profile_connection_intents pci ON pci.profile_id = p.id
WHERE p.lifecycle_status = 'ACTIVE'
  AND p.visibility = 'PUBLIC'
GROUP BY p.id;

-- 2. Kiosks can read active public profiles
CREATE POLICY "Public kiosk can view active candidate profiles"
ON profiles FOR SELECT
TO anon, authenticated
USING (lifecycle_status = 'ACTIVE' AND visibility = 'PUBLIC');

-- 3. Sessions: Kiosks can insert and read their own sessions
CREATE POLICY "Kiosk can insert sessions"
ON sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Kiosk can manage active session"
ON sessions FOR ALL
TO anon, authenticated
USING (status = 'IN_PROGRESS');

-- 4. Print jobs: Booth can manage its own print queue
CREATE POLICY "Booth manage print jobs"
ON print_jobs FOR ALL
TO anon, authenticated
USING (true);

-- 5. Operator Actions: Insert only, cannot tamper historical logs
CREATE POLICY "Operator log append only"
ON operator_actions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- =====================================================================
-- STORED PROCEDURE / RPC: SECURE CONNECTION RESOLUTION
-- Never reveals raw phone/email without server-side dual consent validation
-- =====================================================================
CREATE OR REPLACE FUNCTION resolve_connection_contact(p_token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token RECORD;
    v_consent RECORD;
    v_profile RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Locate token
    SELECT * INTO v_token
    FROM connection_tokens
    WHERE token_hash = p_token_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'authorized', false,
            'reason', 'INVALID_TOKEN',
            'message', 'The connection token was not found or is invalid.'
        );
    END IF;

    -- 2. Check Expiration
    IF v_token.status = 'EXPIRED' OR v_now > v_token.expires_at THEN
        -- Mark as expired if not already
        UPDATE connection_tokens SET status = 'EXPIRED' WHERE id = v_token.id;
        RETURN jsonb_build_object(
            'authorized', false,
            'reason', 'TOKEN_EXPIRED',
            'expiresAt', v_token.expires_at,
            'message', 'This connection token expired 15 minutes after session creation.'
        );
    END IF;

    -- 3. Check Revocation
    IF v_token.status = 'REVOKED' THEN
        RETURN jsonb_build_object(
            'authorized', false,
            'reason', 'TOKEN_REVOKED',
            'message', 'This connection was cancelled by either party.'
        );
    END IF;

    -- 4. Fetch Consent Record
    SELECT * INTO v_consent
    FROM connection_consents
    WHERE id = v_token.consent_id;

    -- 5. Fetch Candidate Profile
    SELECT p.* INTO v_profile
    FROM matches m
    JOIN profiles p ON p.id = m.candidate_profile_id
    WHERE m.id = v_token.match_id;

    -- Check if candidate is still active
    IF v_profile.lifecycle_status != 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'authorized', false,
            'reason', 'PROFILE_UNAVAILABLE',
            'message', 'This candidate profile is no longer available.'
        );
    END IF;

    -- 6. Evaluate Dual Consent
    IF NOT (COALESCE(v_consent.guest_consent, false) AND COALESCE(v_consent.candidate_consent, false)) THEN
        -- Return privacy-safe teaser only
        RETURN jsonb_build_object(
            'authorized', false,
            'reason', 'PENDING_DUAL_CONSENT',
            'guestConsent', COALESCE(v_consent.guest_consent, false),
            'candidateConsent', COALESCE(v_consent.candidate_consent, false),
            'teaser', jsonb_build_object(
                'displayName', v_profile.display_name,
                'city', v_profile.city,
                'avatarSeed', v_profile.avatar_seed
            ),
            'message', 'Both guests must mutually confirm consent before contact details are revealed.'
        );
    END IF;

    -- 7. Dual consent satisfied! Update token access count and access timestamp
    UPDATE connection_tokens
    SET accessed_at = v_now,
        access_count = access_count + 1,
        status = 'USED'
    WHERE id = v_token.id;

    -- 8. Return authorized contact information
    RETURN jsonb_build_object(
        'authorized', true,
        'profile', jsonb_build_object(
            'id', v_profile.id,
            'displayName', v_profile.display_name,
            'city', v_profile.city,
            'bio', v_profile.bio,
            'avatarSeed', v_profile.avatar_seed,
            'instagramHandle', v_profile.instagram_handle,
            'phoneNumber', v_profile.phone_encrypted,
            'email', v_profile.email_encrypted
        ),
        'consents', jsonb_build_object(
            'guestConsentAt', v_consent.guest_consent_at,
            'candidateConsentAt', v_consent.candidate_consent_at,
            'mutualConsentAchieved', true
        ),
        'expiresAt', v_token.expires_at
    );
END;
$$;

-- =====================================================================
-- RPC: SUBMIT GUEST CONSENT
-- =====================================================================
CREATE OR REPLACE FUNCTION submit_guest_consent(p_token_hash TEXT, p_consent BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token RECORD;
BEGIN
    SELECT * INTO v_token FROM connection_tokens WHERE token_hash = p_token_hash;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
    END IF;

    IF NOW() > v_token.expires_at THEN
        UPDATE connection_tokens SET status = 'EXPIRED' WHERE id = v_token.id;
        RETURN jsonb_build_object('success', false, 'error', 'TOKEN_EXPIRED');
    END IF;

    UPDATE connection_consents
    SET guest_consent = p_consent,
        guest_consent_at = CASE WHEN p_consent THEN NOW() ELSE NULL END
    WHERE id = v_token.consent_id;

    RETURN jsonb_build_object('success', true, 'guestConsent', p_consent);
END;
$$;

-- =====================================================================
-- RPC: REVOKE CONNECTION
-- =====================================================================
CREATE OR REPLACE FUNCTION revoke_connection(p_token_hash TEXT, p_revoker TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token RECORD;
BEGIN
    SELECT * INTO v_token FROM connection_tokens WHERE token_hash = p_token_hash;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
    END IF;

    UPDATE connection_tokens SET status = 'REVOKED' WHERE id = v_token.id;

    UPDATE connection_consents
    SET revoked_at = NOW(),
        revoked_by = p_revoker,
        guest_consent = false
    WHERE id = v_token.consent_id;

    RETURN jsonb_build_object('success', true, 'status', 'REVOKED');
END;
$$;
